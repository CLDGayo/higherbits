import ComponentPageServer from "../page"
export { generateMetadata } from "../page"

export default function DemoPage(props: any) {
  return <ComponentPageServer {...props} />
}
