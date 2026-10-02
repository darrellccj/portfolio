import {profile} from './profile'
import {project} from './project'
import {entry} from './entry'
import {ditherStudy} from './ditherStudy'
import {linkItem, contentSection, plate} from './objects'

export const schemaTypes = [
  profile,
  project,
  entry,
  ditherStudy,
  // Shared object types — referenced by name from the documents above.
  linkItem,
  contentSection,
  plate,
]
