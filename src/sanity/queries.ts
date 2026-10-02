import { defineQuery } from 'next-sanity';

// Singletons use fixed IDs (see studio-structure guidance). Projects sort
// by status first — finished work, then work in progress, then parked,
// then ideas — and by the Studio-controlled `order` within each. Log
// entries are always newest first.
//
// Detail pages fetch in two steps: an *_INDEX_QUERY that carries just
// enough to resolve a URL slug and build the previous/next pager, then a
// *_DETAIL_QUERY by `_id`. Splitting them keeps the heavy fields (images,
// long copy) off the index, which the pager and generateStaticParams
// both read for every document.

export const PROFILE_QUERY = defineQuery(`
  *[_type == "profile"][0]{
    name, statement, intro, exploringSince, questions, about, background, email, location,
    socials[]{ label, href }
  }
`);

export const PROJECTS_QUERY = defineQuery(`
  *[_type == "project"] | order(
    select(status == "Done" => 0, status == "In progress" => 1, status == "Parked" => 2, 3) asc,
    order asc,
    year desc
  ){
    _id, tag, title, desc, year, status,
    "slug": slug.current
  }
`);

export const PROJECT_INDEX_QUERY = defineQuery(`
  *[_type == "project"] | order(
    select(status == "Done" => 0, status == "In progress" => 1, status == "Parked" => 2, 3) asc,
    order asc,
    year desc
  ){
    _id, title, "slug": slug.current
  }
`);

export const PROJECT_DETAIL_QUERY = defineQuery(`
  *[_type == "project" && _id == $id][0]{
    _id, title, tag, desc, year, href, status, timeline,
    need, requirements, judgement, decisions, change,
    standing, openQuestions, notes,
    "slug": slug.current,
    links[]{ label, href },
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
    },
    "entries": *[_type == "entry" && references(^._id)] | order(date desc){
      _id, title, date, kind, "slug": slug.current
    }
  }
`);

export const ENTRIES_QUERY = defineQuery(`
  *[_type == "entry"] | order(date desc, _createdAt desc){
    _id, title, date, kind, tags, href,
    "summary": coalesce(summary, body),
    "slug": slug.current
  }
`);

export const LATEST_ENTRIES_QUERY = defineQuery(`
  *[_type == "entry"] | order(date desc, _createdAt desc)[0...5]{
    _id, title, date, kind, tags, href,
    "summary": coalesce(summary, body),
    "slug": slug.current
  }
`);

export const ENTRY_INDEX_QUERY = defineQuery(`
  *[_type == "entry"] | order(date desc, _createdAt desc){
    _id, title, "slug": slug.current
  }
`);

export const ENTRY_DETAIL_QUERY = defineQuery(`
  *[_type == "entry" && _id == $id][0]{
    _id, title, date, kind, tags, summary, body, href,
    "slug": slug.current,
    project->{ _id, title, status, "slug": slug.current }
  }
`);

export const DITHER_QUERY = defineQuery(`
  *[_type == "ditherStudy"][0]{
    work, credit, "imageUrl": image.asset->url
  }
`);
