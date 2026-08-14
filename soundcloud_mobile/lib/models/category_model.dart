class CategoryModel {
  final String id;
  final String name;
  final String? slug;
  final String? description;
  final int trackCount;

  const CategoryModel({
    required this.id,
    required this.name,
    this.slug,
    this.description,
    this.trackCount = 0,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? 'Music').toString(),
      slug: json['slug']?.toString(),
      description: json['description']?.toString(),
      trackCount: int.tryParse((json['trackCount'] ?? 0).toString()) ?? 0,
    );
  }
}
