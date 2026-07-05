interface CodePillProps {
  code: string
}

export function CodePill({ code }: CodePillProps) {
  return <span className="code-pill">{code}</span>
}
