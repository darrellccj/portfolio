import {profile} from './profile'
import {project} from './project'
import {kivItem} from './kivItem'
import {ditherStudy} from './ditherStudy'
import {linkItem, metric, contentSection, plate} from './objects'

export const schemaTypes = [
  profile,
  project,
  kivItem,
  ditherStudy,
  // Shared object types — referenced by name from the documents above.
  linkItem,
  metric,
  contentSection,
  plate,
]
