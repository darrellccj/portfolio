import type {StructureResolver} from 'sanity/structure'

// Singletons get fixed document ids so there is exactly one of each.
const SINGLETONS = [
  {id: 'profile', type: 'profile', title: 'Profile'},
  {id: 'ditherStudy', type: 'ditherStudy', title: 'Dither study'},
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      ...SINGLETONS.map(({id, type, title}) =>
        S.listItem()
          .title(title)
          .id(id)
          .child(S.document().schemaType(type).documentId(id).title(title)),
      ),
      S.divider(),
      S.documentTypeListItem('project').title('Projects'),
      S.documentTypeListItem('kivItem').title('KIV'),
    ])
