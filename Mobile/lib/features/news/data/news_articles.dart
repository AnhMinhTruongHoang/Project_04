class NewsArticle {
  const NewsArticle({
    required this.slug,
    required this.image,
    required this.category,
    required this.title,
    required this.description,
    required this.author,
    required this.readTime,
    required this.publishedAt,
    required this.body,
  });

  final String slug;
  final String image;
  final String category;
  final String title;
  final String description;
  final String author;
  final String readTime;
  final String publishedAt;
  final List<String> body;
}

const List<NewsArticle> newsArticles = [
  NewsArticle(
    slug: 'blackpink-visual-language',
    image: 'assets/images/news/blackpink01.jpg',
    category: 'K-Pop',
    title: 'BLACKPINK: Four Voices, One Visual Language',
    description:
        'An editorial journey through BLACKPINK distinct identities, iconic performances, global influence, and a powerful black-and-pink universe.',
    author: 'SoundClone',
    readTime: '6 min read',
    publishedAt: 'Aug 2026',
    body: [
      'BLACKPINK works because each member carries a clear visual identity, but the group still moves as one brand. The result is a language built from contrast: sharp choreography, luxury styling, pop hooks, and a stage presence that feels instantly recognizable.',
      'The black-and-pink idea is more than a color palette. It lets the group switch between elegance and impact without losing shape. Jennie, Jisoo, Rose, and Lisa each bring a different emotional texture, making every comeback feel like a campaign as much as a song release.',
      'For modern K-Pop, that kind of visual consistency matters. Fans do not only remember a chorus; they remember a frame, a costume, a pose, and a mood. BLACKPINK turned those details into part of the music itself.',
    ],
  ),
  NewsArticle(
    slug: 'blinding-lights-red-neon-fever-dream',
    image: 'assets/images/news/weeknd01.jpg',
    category: 'Synth-Pop',
    title: 'Blinding Lights: The Red-Neon Fever Dream',
    description:
        'A midnight ride through neon loneliness, retro synths, fast cars, and the cinematic visual language behind a pop era.',
    author: 'Minh',
    readTime: '5 min read',
    publishedAt: 'Aug 2026',
    body: [
      'Blinding Lights feels fast before the vocal even arrives. The synth line, the driving drums, and the glowing red visual world all point in the same direction: motion, danger, and a city that never really sleeps.',
      'The song borrows from the 1980s without becoming a museum piece. Its power comes from the way retro sound is placed inside modern pop tension. The listener gets nostalgia, but the performance still feels restless and present.',
      'That is why the visual identity became inseparable from the track. Red lights, night roads, sunglasses, and bruised glamour made the single feel like a scene from a film people already knew by heart.',
    ],
  ),
  NewsArticle(
    slug: 'son-tung-pop-visual-era',
    image: 'assets/images/news/sontungP.jpg',
    category: 'V-Pop',
    title: 'Son Tung M-TP: Pop As A Visual Era',
    description:
        'A cinematic look at image, ambition, sound, and the influence behind modern Vietnamese pop culture.',
    author: 'SoundClone',
    readTime: '7 min read',
    publishedAt: 'Aug 2026',
    body: [
      'Son Tung M-TP helped shape a version of V-Pop where sound, styling, and image move together. His releases often feel built around a full world instead of only a single song.',
      'That world is important because Vietnamese pop has become more visually ambitious. Music videos, fashion, typography, and performance choices are now part of how an artist tells the audience who they are.',
      'The strongest moments in his catalog are not only catchy. They feel designed. They turn confidence, melancholy, and star power into something fans can recognize before the first chorus ends.',
    ],
  ),
  NewsArticle(
    slug: 'ncs-colored-circles-creators',
    image: 'assets/images/news/ncs.jpg',
    category: 'Electronic',
    title: 'NCS: The Colored Circles That Powered Creators',
    description:
        'The story of NoCopyrightSounds, electronic music culture, independent creators, and an identity recognized worldwide.',
    author: 'Minh',
    readTime: '4 min read',
    publishedAt: 'Aug 2026',
    body: [
      'NCS became part of creator culture because it solved a real problem: people needed energetic music they could use without turning every upload into a copyright risk.',
      'The colored circle became a simple but powerful symbol. It made tracks feel connected even when artists, genres, and moods changed from release to release.',
      'For a generation of editors, streamers, and gaming channels, NCS was not just background music. It was the sound of learning to make things online.',
    ],
  ),
];

NewsArticle? findNewsArticle(String slug) {
  for (final article in newsArticles) {
    if (article.slug == slug) {
      return article;
    }
  }

  return null;
}
