import {draftMode} from 'next/headers';
import {redirect} from 'next/navigation';

// Counterpart to api/draft-mode/enable. Not wired into presentationTool's
// previewUrl config — its `disable` option is unimplemented upstream — so
// Studio Mode calls this route itself when the modal closes.
export async function GET() {
  (await draftMode()).disable();
  redirect('/');
}
