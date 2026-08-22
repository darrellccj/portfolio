import { defineQuery } from 'next-sanity';

// Singletons use fixed IDs (see studio-structure guidance); everything
// else is ordered by an explicit `order` field so the Studio controls
// sequence rather than the query.

export const PROFILE_QUERY = defineQuery(`
  *[_type == "profile"][0]{
    name, role, roles, tagline, about, email, location,
    socials[]{ label, href },
    stack
  }
`);

export const PROJECTS_QUERY = defineQuery(`
  *[_type == "project"] | order(order asc, year desc){
    _id, tag, title, desc, year, href
  }
`);

export const KIV_QUERY = defineQuery(`
  *[_type == "kivItem"] | order(order asc){
    _id, tag, title, desc
  }
`);

export const DITHER_QUERY = defineQuery(`
  *[_type == "ditherStudy"][0]{
    work, credit, "imageUrl": image.asset->url
  }
`);
