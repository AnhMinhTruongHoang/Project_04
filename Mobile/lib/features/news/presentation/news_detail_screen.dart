import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../data/news_articles.dart';

class NewsDetailScreen extends StatelessWidget {
  const NewsDetailScreen({
    super.key,
    required this.slug,
  });

  final String slug;

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _cyan = Color(0xFF00E5D4);

  @override
  Widget build(BuildContext context) {
    final article = findNewsArticle(slug);

    if (article == null) {
      return const _MissingArticleScreen();
    }

    final related = <String, NewsArticle>{
      for (final item in newsArticles)
        if (item.slug != article.slug && item.category == article.category)
          item.slug: item,
      for (final item in newsArticles)
        if (item.slug != article.slug) item.slug: item,
    }.values.take(3).toList();

    return Scaffold(
      backgroundColor: _background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 300,
            backgroundColor: _background,
            leading: IconButton(
              tooltip: 'Back',
              color: Colors.white,
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back_rounded),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(article.image, fit: BoxFit.cover),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Color(0xDD0D0D0D),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 132),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _DetailTag(article.category),
                  const SizedBox(height: 12),
                  Text(
                    article.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 30,
                      height: 1.04,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    article.description,
                    style: const TextStyle(
                      color: Color(0xFFB9B9B9),
                      fontSize: 15,
                      height: 1.42,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 18),
                  _DetailMeta(article: article),
                  const SizedBox(height: 26),
                  ...article.body.map((paragraph) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 18),
                      child: Text(
                        paragraph,
                        style: const TextStyle(
                          color: Color(0xFFE6E6E6),
                          fontSize: 16,
                          height: 1.55,
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 12),
                  _ActionButton(
                    icon: Icons.ios_share_rounded,
                    label: 'Share',
                    onTap: () => _shareArticle(context, article),
                  ),
                  const SizedBox(height: 30),
                  const Text(
                    'Related stories',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 14),
                  ...related.map((item) {
                    return _RelatedArticleTile(
                      article: item,
                      onTap: () => context.push('/news/${item.slug}'),
                    );
                  }),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Future<void> _shareArticle(
    BuildContext context,
    NewsArticle article,
  ) async {
    final text = '${article.title}\n/news/${article.slug}';

    await Clipboard.setData(ClipboardData(text: text));

    if (!context.mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('News link copied')),
    );
  }
}

class _DetailTag extends StatelessWidget {
  const _DetailTag(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: NewsDetailScreen._cyan,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(
            color: Colors.black,
            fontSize: 11,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }
}

class _DetailMeta extends StatelessWidget {
  const _DetailMeta({required this.article});

  final NewsArticle article;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const CircleAvatar(
          radius: 17,
          backgroundImage: AssetImage('assets/images/sc_logo.png'),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                article.author,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                '${article.publishedAt} - ${article.readTime}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF9A9A9A),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 19),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: const BorderSide(color: Color(0xFF3A3A3A)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }
}

class _RelatedArticleTile extends StatelessWidget {
  const _RelatedArticleTile({
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
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                article.image,
                width: 76,
                height: 76,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    article.category.toUpperCase(),
                    style: const TextStyle(
                      color: NewsDetailScreen._cyan,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    article.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      height: 1.14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    article.readTime,
                    style: const TextStyle(
                      color: Color(0xFF9A9A9A),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MissingArticleScreen extends StatelessWidget {
  const _MissingArticleScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NewsDetailScreen._background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.article_outlined,
                color: Color(0xFF555555),
                size: 50,
              ),
              const SizedBox(height: 14),
              const Text(
                'Story not found',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'This news story may have moved or been removed.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF9A9A9A),
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 18),
              FilledButton(
                onPressed: () => context.go('/news'),
                child: const Text('Back to News'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
