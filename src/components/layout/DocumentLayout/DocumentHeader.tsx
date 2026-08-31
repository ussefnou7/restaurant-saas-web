import { DetailHeader, type DetailHeaderProps } from '../../entity-detail/DetailHeader'

export type DocumentHeaderProps = DetailHeaderProps

export function DocumentHeader(props: DocumentHeaderProps) {
  return <DetailHeader {...props} />
}
