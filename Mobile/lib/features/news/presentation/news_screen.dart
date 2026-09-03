import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../data/news_articles.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  static const Color _background = Color(0xFF0D0D0D);
  static const Color _surface = Color(0xFF181A1F);
  static const Color _orange = Color(0xFFFF5500);

  final TextEditingController _searchController = TextEditingController();

  String _category = 'All';
  String _query = '';

  static const List<String> _categories = [
    'All',
    'V-Pop',
    'Synth-Pop',
    'Electronic',
    'K-Pop',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<NewsArticle> get _filteredArticles {
    final normalizedQuery = _query.trim().toLowerCase();

    return newsArticles.where((article) {
      final matchesCategory =
          _category == 'All' || article.category == _category;
      final matchesQuery = normalizedQuery.isEmpty ||
          article.title.toLowerCase().contains(normalizedQuery) ||
          article.description.toLowerCase().contains(normalizedQuery) ||
          article.category.toLowerCase().contains(normalizedQuery);

      return matchesCategory && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final articles = _filteredArticles;
    final featured = articles.isEmpty ? null : articles.first;

    return Scaffold(
      backgroundColor: _background,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 132),
        children: [
          const Text(
            'News',
            style: TextStyle(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Explore cinematic eMagazines about artists, songs, and the cultures behind them.',
            style: TextStyle(
              color: Color(0xFF9B9B9B),
              fontSize: 14,
              height: 1.35,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 20),
          _NewsSearchField(
            controller: _searchController,
            onChanged: (value) {
              setState(() {
                _query = value;
              });
            },
            onClear: () {
              _searchController.clear();
              setState(() {
                _query = '';
              });
            },
          ),
          const SizedBox(height: 16),
          _CategoryChips(
            categories: _categories,
            selected: _category,
            onSelected: (category) {
              setState(() {
                _category = category;
              });
            },
          ),
          const SizedBox(height: 22),
          if (featured != null) ...[
            _FeaturedArticleCard(
              article: featured,
              onTap: () => context.push('/news/${featured.slug}'),
            ),
            const SizedBox(height: 24),
          ],
          Row(
            children: [
              Text(
                _category == 'All' ? 'Latest stories' : _category,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const Spacer(),
              Text(
                '${articles.length}',
                style: const TextStyle(
                  color: _orange,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (articles.isEmpty)
            const _EmptyNewsState()
          else
            ...articles.map((article) {
              return _NewsListArticle(
                article: article,
                onTap: () => context.push('/news/${article.slug}'),
              );
            }),
        ],
      ),
    );
  }
}

class _NewsSearchField extends StatelessWidget {
  const _NewsSearchField({
    required this.controller,
    required this.onChanged,
    required this.onClear,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      textInputAction: TextInputAction.search,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: 'Search stories',
        hintStyle: const TextStyle(color: Color(0xFF8F8F8F)),
        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF9C9C9C)),
        suffixIcon: controller.text.isEmpty
            ? null
            : IconButton(
                tooltip: 'Clear',
                color: const Color(0xFFBDBDBD),
                onPressed: onClear,
                icon: const Icon(Icons.close_rounded),
              ),
        filled: true,
        fillColor: const Color(0xFF1E1E1E),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
      ),
    );
  }
}

class _CategoryChips extends StatelessWidget {
  const _CategoryChips({
    required this.categories,
    required this.selected,
    required this.onSelected,
  });

  final List<String> categories;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final category = categories[index];
          final active = category == selected;

          return ChoiceChip(
            label: Text(category == 'All' ? 'All stories' : category),
            selected: active,
            onSelected: (_) => onSelected(category),
            labelStyle: TextStyle(
              color: active ? Colors.black : const Color(0xFFD0D0D0),
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
            selectedColor: const Color(0xFF00E5D4),
            backgroundColor: const Color(0xFF171717),
            side: BorderSide(
              color: active ? const Color(0xFF00E5D4) : const Color(0xFF343434),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
          );
        },
      ),
    );
  }
}

class _FeaturedArticleCard extends StatelessWidget {
  const _FeaturedArticleCard({
    required this.article,
    required this.onTap,
  });

  final NewsArticle article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _NewsScreenState._surface,
      borderRadius: BorderRadius.circular(8),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        hoverColor: const Color(0x2200E5D4),
        splashColor: const Color(0x3300E5D4),
        mouseCursor: SystemMouseCursors.click,
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 10,
              child: Image.asset(article.image, fit: BoxFit.cover),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ArticleTag(article.category),
                  const SizedBox(height: 10),
                  Text(
                    article.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      height: 1.08,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    article.description,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFFB0B0B0),
                      fontSize: 13,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _ArticleMeta(article: article),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NewsListArticle extends StatelessWidget {
  const _NewsListArticle({
    required this.article,
    required this.onTap,
  });

  final NewsArticle article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      hoverColor: const Color(0x1A00E5D4),
      splashColor: const Color(0x3300E5D4),
      mouseCursor: SystemMouseCursors.click,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                article.image,
                width: 104,
                height: 104,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 104,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _ArticleTag(article.category),
                    const SizedBox(height: 7),
                    Text(
                      article.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        height: 1.12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    _ArticleMeta(article: article),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ArticleTag extends StatelessWidget {
  const _ArticleTag(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(
        color: Color(0xFF00E5D4),
        fontSize: 11,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class _ArticleMeta extends StatelessWidget {
  const _ArticleMeta({required this.article});

  final NewsArticle article;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const CircleAvatar(
          radius: 10,
          backgroundImage: AssetImage('assets/images/sc_logo.png'),
        ),
        const SizedBox(width: 7),
        Expanded(
          child: Text(
            '${article.author} - ${article.readTime}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF9A9A9A),
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _EmptyNewsState extends StatelessWidget {
  const _EmptyNewsState();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(top: 64),
      child: Column(
        children: [
          Icon(Icons.article_outlined, color: Color(0xFF555555), size: 48),
          SizedBox(height: 12),
          Text(
            'No stories found',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Try another keyword or category.',
            style: TextStyle(
              color: Color(0xFF9A9A9A),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
