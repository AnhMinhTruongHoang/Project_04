import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';

import '../../../services/api/api_service.dart';
import '../../auth/models/user_model.dart';
import '../../home/models/home_track.dart';
import '../../player/providers/player_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);
  static const String _recentSearchesKey = 'soundclone_recent_searches';
  static const int _maxRecentSearches = 8;

  final TextEditingController _controller = TextEditingController();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<_SearchResults>? _future;
  Future<_SearchUserData>? _userFuture;
  Timer? _debounce;
  List<String> _recentSearches = const [];
  String _query = '';

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _scheduleSearch(String value) {
    _debounce?.cancel();

    if (value.trim().isEmpty) {
      _search('');
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 450), () => _search(value));
  }

  void _search(String value) {
    _debounce?.cancel();

    final query = value.trim();

    setState(() {
      _query = query;
      _future = query.isEmpty ? null : _loadResults(query);
    });
  }

  void _submitSearch(String value) {
    _search(value);
    _addRecentSearch(value);
  }

  Future<void> _loadRecentSearches() async {
    final raw = await _storage.read(key: _recentSearchesKey);

    if (!mounted || raw == null || raw.isEmpty) {
      return;
    }

    try {
      final values = jsonDecode(raw);

      if (values is! List) {
        return;
      }

      setState(() {
        _recentSearches = values
            .whereType<String>()
            .map((item) => item.trim())
            .where((item) => item.isNotEmpty)
            .take(_maxRecentSearches)
            .toList();
      });
    } catch (_) {
      await _storage.delete(key: _recentSearchesKey);
    }
  }

  Future<void> _addRecentSearch(String value) async {
    final query = value.trim();

    if (query.isEmpty) {
      return;
    }

    final updated = [
      query,
      ..._recentSearches.where(
        (item) => item.toLowerCase() != query.toLowerCase(),
      ),
    ].take(_maxRecentSearches).toList();

    setState(() {
      _recentSearches = updated;
    });

    await _saveRecentSearches(updated);
  }

  Future<void> _removeRecentSearch(String value) async {
    final updated = _recentSearches.where((item) => item != value).toList();

    setState(() {
      _recentSearches = updated;
    });

    await _saveRecentSearches(updated);
  }

  Future<void> _saveRecentSearches(List<String> values) {
    return _storage.write(key: _recentSearchesKey, value: jsonEncode(values));
  }

  void _applySuggestion(String value) {
    final query = value.trim();

    if (query.isEmpty) {
      return;
    }

    _controller.text = query;
    _controller.selection = TextSelection.collapsed(offset: query.length);
    _submitSearch(query);
  }

  Future<_SearchResults> _loadResults(String query) async {
    final api = ApiService.instance;
    final usersFuture = _loadUsers(api);
    final serverTracksFuture = api.searchTracksApi(query);
    final userData = await usersFuture;
    final serverTracksResponse = await serverTracksFuture;

    final tracks = serverTracksResponse.isSuccess
        ? _resultList(serverTracksResponse.data)
              .map(HomeTrack.fromJson)
              .where((track) => track.id.isNotEmpty)
              .toList()
        : <HomeTrack>[];

    final normalizedQuery = _normalizedText(query);

    final userMap = <String, UserModel>{};

    for (final user in userData.items) {
      if (user.id.isNotEmpty) {
        userMap[user.id] = user;
      }
    }

    for (final track in tracks) {
      final uploaderId = track.uploaderId?.trim();
      final uploaderName = track.uploaderName?.trim();

      if (uploaderId == null ||
          uploaderId.isEmpty ||
          uploaderName == null ||
          uploaderName.isEmpty ||
          userMap.containsKey(uploaderId)) {
        continue;
      }

      userMap[uploaderId] = UserModel(
        id: uploaderId,
        email: '',
        name: uploaderName,
        role: 'USER',
      );
    }

    final users = userMap.values
        .where((user) => _matchesUser(user, normalizedQuery))
        .take(8)
        .toList();

    return _SearchResults(
      tracks: tracks,
      users: users,
      hasError: !serverTracksResponse.isSuccess && userData.hasError,
    );
  }

  Future<_SearchUserData> _loadUsers(ApiService api) {
    final existingFuture = _userFuture;

    if (existingFuture != null) {
      return existingFuture;
    }

    final future = _fetchUsers(api);
    _userFuture = future;
    return future;
  }

  Future<_SearchUserData> _fetchUsers(ApiService api) async {
    final responses = await Future.wait([
      api.getWhoToFollowApi(limit: 24),
      api.getMyFollowingApi(),
      api.getArtistLeaderboardApi(limit: 24),
    ]);

    final userMap = <String, UserModel>{};

    for (final user in [
      ..._usersFromResponse(responses[0]),
      ..._usersFromResponse(responses[1]),
      ..._usersFromResponse(responses[2]),
    ]) {
      if (user.id.isNotEmpty) {
        userMap[user.id] = user;
      }
    }

    return _SearchUserData(
      items: userMap.values.toList(),
      hasError:
          !responses[0].isSuccess &&
          !responses[1].isSuccess &&
          !responses[2].isSuccess,
    );
  }

  List<UserModel> _usersFromResponse(ApiResponse<dynamic> response) {
    if (!response.isSuccess) {
      return const <UserModel>[];
    }

    return _resultList(response.data)
        .whereType<Map>()
        .map((item) => UserModel.fromJson(Map<String, dynamic>.from(item)))
        .where((user) => user.id.isNotEmpty)
        .toList();
  }

  List<dynamic> _resultList(dynamic value) {
    final data = value is Map && value['data'] != null ? value['data'] : value;

    if (data is List) {
      return data;
    }

    if (data is Map) {
      final result = data['result'];

      if (result is List) {
        return result;
      }

      final items = data['items'];

      if (items is List) {
        return items;
      }
    }

    return const <dynamic>[];
  }

  bool _matchesUser(UserModel user, String query) {
    final name = _normalizedText(user.name);

    return name.contains(query);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: _background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
              child: Row(
                children: [
                  IconButton(
                    tooltip: 'Back',
                    color: Colors.white,
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      autofocus: true,
                      textInputAction: TextInputAction.search,
                      onChanged: _scheduleSearch,
                      onSubmitted: _submitSearch,
                      decoration: InputDecoration(
                        hintText: 'Search',
                        filled: true,
                        fillColor: const Color(0xFF303030),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(30),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 18,
                        ),
                        suffixIcon: _query.isEmpty
                            ? null
                            : IconButton(
                                tooltip: 'Clear search',
                                onPressed: () {
                                  _controller.clear();
                                  _search('');
                                },
                                icon: const Icon(Icons.cancel_rounded),
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _future == null
                  ? _SearchIdle(
                      searches: _recentSearches,
                      onSearchTap: (query) {
                        _controller.text = query;
                        _controller.selection = TextSelection.collapsed(
                          offset: query.length,
                        );
                        _submitSearch(query);
                      },
                      onRemoveSearch: _removeRecentSearch,
                    )
                  : FutureBuilder<_SearchResults>(
                      future: _future,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState != ConnectionState.done) {
                          return const Center(
                            child: CircularProgressIndicator(color: _orange),
                          );
                        }

                        if (snapshot.hasError ||
                            snapshot.data == null ||
                            snapshot.data!.hasError) {
                          return const _SearchStateMessage(
                            icon: Icons.cloud_off_rounded,
                            title: 'Could not search',
                            subtitle: 'Check your connection and try again.',
                          );
                        }

                        final results = snapshot.data!;
                        final suggestions = _suggestionsFor(
                          query: _query,
                          results: results,
                        );

                        if (results.tracks.isEmpty &&
                            results.users.isEmpty &&
                            suggestions.isEmpty) {
                          return const _SearchStateMessage(
                            icon: Icons.search_off_rounded,
                            title: 'No results found',
                            subtitle: 'Try another keyword.',
                          );
                        }

                        return _SearchResultsList(
                          results: results,
                          suggestions: suggestions,
                          onSuggestionTap: _applySuggestion,
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

List<String> _suggestionsFor({
  required String query,
  required _SearchResults results,
}) {
  final normalizedQuery = _normalizedText(query);

  if (normalizedQuery.isEmpty) {
    return const <String>[];
  }

  final suggestions = <String>{};

  for (final user in results.users) {
    suggestions.add(user.name);
  }

  for (final track in results.tracks) {
    suggestions.add(track.title);

    final artist = track.uploaderName?.trim();
    if (artist != null && artist.isNotEmpty) {
      suggestions.add(artist);
    }
  }

  return suggestions
      .where((item) => item.trim().isNotEmpty)
      .where((item) => _normalizedText(item).contains(normalizedQuery))
      .take(6)
      .toList();
}

String _normalizedText(String value) {
  var text = value.trim().toLowerCase();

  const replacements = {
    'à': 'a',
    'á': 'a',
    'ả': 'a',
    'ã': 'a',
    'ạ': 'a',
    'ă': 'a',
    'ằ': 'a',
    'ắ': 'a',
    'ẳ': 'a',
    'ẵ': 'a',
    'ặ': 'a',
    'â': 'a',
    'ầ': 'a',
    'ấ': 'a',
    'ẩ': 'a',
    'ẫ': 'a',
    'ậ': 'a',
    'è': 'e',
    'é': 'e',
    'ẻ': 'e',
    'ẽ': 'e',
    'ẹ': 'e',
    'ê': 'e',
    'ề': 'e',
    'ế': 'e',
    'ể': 'e',
    'ễ': 'e',
    'ệ': 'e',
    'ì': 'i',
    'í': 'i',
    'ỉ': 'i',
    'ĩ': 'i',
    'ị': 'i',
    'ò': 'o',
    'ó': 'o',
    'ỏ': 'o',
    'õ': 'o',
    'ọ': 'o',
    'ô': 'o',
    'ồ': 'o',
    'ố': 'o',
    'ổ': 'o',
    'ỗ': 'o',
    'ộ': 'o',
    'ơ': 'o',
    'ờ': 'o',
    'ớ': 'o',
    'ở': 'o',
    'ỡ': 'o',
    'ợ': 'o',
    'ù': 'u',
    'ú': 'u',
    'ủ': 'u',
    'ũ': 'u',
    'ụ': 'u',
    'ư': 'u',
    'ừ': 'u',
    'ứ': 'u',
    'ử': 'u',
    'ữ': 'u',
    'ự': 'u',
    'ỳ': 'y',
    'ý': 'y',
    'ỷ': 'y',
    'ỹ': 'y',
    'ỵ': 'y',
    'đ': 'd',
  };

  for (final entry in replacements.entries) {
    text = text.replaceAll(entry.key, entry.value);
  }

  return text;
}

class _SearchResults {
  const _SearchResults({
    required this.tracks,
    required this.users,
    this.hasError = false,
  });

  final List<HomeTrack> tracks;
  final List<UserModel> users;
  final bool hasError;
}

class _SearchUserData {
  const _SearchUserData({required this.items, this.hasError = false});

  final List<UserModel> items;
  final bool hasError;
}

class _SearchResultsList extends ConsumerWidget {
  const _SearchResultsList({
    required this.results,
    required this.suggestions,
    required this.onSuggestionTap,
  });

  final _SearchResults results;
  final List<String> suggestions;
  final ValueChanged<String> onSuggestionTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 130),
      children: [
        if (suggestions.isNotEmpty) ...[
          const _SectionTitle('Suggestions'),
          ...suggestions.map((suggestion) {
            return _SuggestionTile(
              text: suggestion,
              onTap: () => onSuggestionTap(suggestion),
            );
          }),
          const SizedBox(height: 18),
        ],
        if (results.users.isNotEmpty) ...[
          const _SectionTitle('People'),
          ...results.users.map((user) {
            return _UserResultTile(user: user);
          }),
          const SizedBox(height: 18),
        ],
        if (results.tracks.isNotEmpty) ...[
          const _SectionTitle('Tracks'),
          ...results.tracks.map((track) {
            return _TrackResultTile(
              track: track,
              onTap: () {
                final key = track.slug?.trim().isNotEmpty == true
                    ? track.slug!
                    : track.id;

                if (key.isNotEmpty) {
                  context.push('/track/$key', extra: track);
                }
              },
              onPlay: () {
                ref
                    .read(playerProvider.notifier)
                    .playTrack(track, queue: results.tracks);
              },
            );
          }),
        ],
      ],
    );
  }
}

class _SearchIdle extends StatelessWidget {
  const _SearchIdle({
    required this.searches,
    required this.onSearchTap,
    required this.onRemoveSearch,
  });

  final List<String> searches;
  final ValueChanged<String> onSearchTap;
  final ValueChanged<String> onRemoveSearch;

  @override
  Widget build(BuildContext context) {
    if (searches.isEmpty) {
      return const _SearchStateMessage(
        icon: Icons.search_rounded,
        title: 'Search SoundClone',
        subtitle: 'Find tracks and people.',
      );
    }

    return ListView(
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: const EdgeInsets.fromLTRB(28, 22, 28, 120),
      children: [
        const Text(
          'Recent searches',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 18),
        ...searches.map((query) {
          return _RecentSearchTile(
            query: query,
            onTap: () => onSearchTap(query),
            onRemove: () => onRemoveSearch(query),
          );
        }),
      ],
    );
  }
}

class _SuggestionTile extends StatelessWidget {
  const _SuggestionTile({required this.text, required this.onTap});

  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      leading: const Icon(Icons.search_rounded, color: Color(0xFFBDBDBD)),
      title: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
      trailing: const Icon(Icons.north_west_rounded, color: Color(0xFFBDBDBD)),
      onTap: onTap,
    );
  }
}

class _RecentSearchTile extends StatelessWidget {
  const _RecentSearchTile({
    required this.query,
    required this.onTap,
    required this.onRemove,
  });

  final String query;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      minLeadingWidth: 0,
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      leading: const SizedBox(
        width: 56,
        height: 56,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Color(0xFF242424),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.history_rounded, color: Color(0xFFBDBDBD)),
        ),
      ),
      title: Text(
        query,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w900,
        ),
      ),
      trailing: IconButton(
        tooltip: 'Remove',
        color: const Color(0xFFBDBDBD),
        onPressed: onRemove,
        icon: const Icon(Icons.close_rounded),
      ),
      onTap: onTap,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _UserResultTile extends StatelessWidget {
  const _UserResultTile({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final avatar = ApiService.instance.getAvatarUrl(user.avatarUrl);

    return ListTile(
      contentPadding: EdgeInsets.zero,
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      leading: CircleAvatar(
        radius: 29,
        backgroundColor: const Color(0xFF2A2A2A),
        backgroundImage: avatar.isEmpty ? null : NetworkImage(avatar),
        child: avatar.isEmpty
            ? const Icon(Icons.person_rounded, color: Colors.white70)
            : null,
      ),
      title: Text(
        user.name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
        ),
      ),
      subtitle: Text(
        user.username == null ? user.email : '@${user.username}',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: Color(0xFFAAAAAA)),
      ),
      onTap: () {
        context.push('/profile/${user.id}');
      },
    );
  }
}

class _TrackResultTile extends StatelessWidget {
  const _TrackResultTile({
    required this.track,
    required this.onTap,
    required this.onPlay,
  });

  final HomeTrack track;
  final VoidCallback onTap;
  final VoidCallback onPlay;

  @override
  Widget build(BuildContext context) {
    final image = track.resolvedImageUrl;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 58,
          height: 58,
          color: const Color(0xFF242424),
          child: image == null
              ? const Icon(Icons.music_note_rounded, color: Colors.white70)
              : Image.network(
                  image,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) {
                    return const Icon(
                      Icons.music_note_rounded,
                      color: Colors.white70,
                    );
                  },
                ),
        ),
      ),
      title: Text(
        track.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
        ),
      ),
      subtitle: Text(
        track.artistName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: Color(0xFFAAAAAA)),
      ),
      trailing: IconButton(
        tooltip: 'Play',
        color: _SearchScreenState._orange,
        onPressed: onPlay,
        icon: const Icon(Icons.play_circle_fill_rounded),
      ),
      onTap: onTap,
    );
  }
}

class _SearchStateMessage extends StatelessWidget {
  const _SearchStateMessage({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: const Color(0xFF555555), size: 54),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF999999), fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}
