import { redirect } from 'next/navigation';

type Props = {
  params: { companyId: string };
};

export default function Page({ params }: Props) {
  // This route was removed in favor of the modal-based create flow.
  // Redirect back to the teams list to avoid dead pages.
  const { companyId } = params;
  redirect(`/company/${encodeURIComponent(companyId)}/teams`);
}
