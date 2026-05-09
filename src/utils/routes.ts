type Sluggable = {
  id: number | string;
  slug?: string | null;
};

const getSlugSegment = (item: Sluggable) => item.slug || item.id;

export const getEntityPath = (basePath: string, item: Sluggable) =>
  `${basePath}/${getSlugSegment(item)}`;

export const getProductPath = (item: Sluggable) => getEntityPath('/products', item);

export const getDesignPath = (item: Sluggable) => getEntityPath('/designs', item);

export const getFabricPath = (item: Sluggable) => getEntityPath('/fabrics', item);

export const getBlogPath = (item: Sluggable) => getEntityPath('/blogs', item);

export const getCategoryPath = (item: Sluggable) => getEntityPath('/categories', item);
