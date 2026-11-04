import * as React from "react"

export default function Link({
  href,
  prefetch: _prefetch,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  prefetch?: boolean
}) {
  return <a href={href} {...props}>{children}</a>
}
