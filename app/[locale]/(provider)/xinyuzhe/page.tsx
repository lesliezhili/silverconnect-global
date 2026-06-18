import { redirect } from 'next/navigation'

export default async function XinyuzheProviderPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(\`/${locale}/xinyuzhe/about\`)
}
