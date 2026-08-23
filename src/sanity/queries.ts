import { defineQuery } from 'next-sanity';

// Singletons use fixed IDs (see studio-structure guidance); everything
// else is ordered by an explicit `order` field so the Studio controls
// sequence rather than the query.
//
// Detail pages fetch in two steps: an *_INDEX_QUERY that carries just
// enough to resolve a URL slug and build the previous/next pager, then a
// *_DETAIL_QUERY by `_id`. Splitting them keeps the heavy fields (images,
// long copy) off the index, which the pager and generateStaticParams
// both read for every document.

export const PROFILE_QUERY = defineQuery(`
  *[_type == "profile"][0]{
    name, role, roles, tagline, about, email, location,
    socials[]{ label, href },
    stack
  }
`);

export const PROJECTS_QUERY = defineQuery(`
  *[_type == "project"] | order(order asc, year desc){
    _id, tag, title, desc, year, href, status,
    "slug": slug.current
  }
`);

export const PROJECT_INDEX_QUERY = defineQuery(`
  *[_type == "project"] | order(order asc, year desc){
    _id, title, tag, "slug": slug.current
  }
`);

export const PROJECT_DETAIL_QUERY = defineQuery(`
  *[_type == "project" && _id == $id][0]{
    _id, title, tag, desc, year, href, status, role, timeline, stack,
    overview, problem, approach, outcome,
    "slug": slug.current,
    links[]{ label, href },
    metrics[]{ value, label },
    sections[]{ heading, body },
    cover{
      alt, caption,
      "url": asset->url,
      "lqip": asset->metadata.lqip,
      "aspect": asset->metadata.dimensions.aspectRatio
    },
    gallery[]{
      alt, caption,
      "url": asset->url,
      "lqip": asset->metadata.lqip,
      "aspect": asset->metadata.dimensions.aspectRatio
    }
  }
`);

export const KIV_QUERY = defineQuery(`
  *[_type == "kivItem"] | order(order asc){
    _id, tag, title, desc, status,
    "slug": slug.current
  }
`);

export const KIV_INDEX_QUERY = defineQuery(`
  *[_type == "kivItem"] | order(order asc){
    _id, title, tag, "slug": slug.current
  }
`);

export const KIV_DETAIL_QUERY = defineQuery(`
  *[_type == "kivItem" && _id == $id][0]{
    _id, title, tag, desc, status, premise, why, notes, openQuestions, stack,
    "slug": slug.current,
    sections[]{ heading, body }
  }
`);

export const DITHER_QUERY = defineQuery(`
  *[_type == "ditherStudy"][0]{
    work, credit, "imageUrl": image.asset->url
  }
`);
