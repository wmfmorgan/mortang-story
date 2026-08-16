import { Button, Field, Input } from '../ui'

export type LinkDraft = { url: string; title: string }

type Props = {
  files: File[]
  links: LinkDraft[]
  onFiles: (files: File[]) => void
  onLinks: (links: LinkDraft[]) => void
}

export function MediaFields({ files, links, onFiles, onLinks }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Photos" hint="Optional. They belong to the event, not to one telling.">
        <input
          type="file"
          accept="image/*"
          multiple
          className="w-full text-sm text-ink-soft"
          onChange={(event) => onFiles(Array.from(event.target.files ?? []))}
        />
        {files.length > 0 ? (
          <span className="mt-1 block text-xs text-ink-soft">
            {files.length} photo{files.length === 1 ? '' : 's'} selected
          </span>
        ) : null}
      </Field>
      <div className="space-y-2">
        <span className="block text-xs font-medium uppercase tracking-wider text-ink-soft">
          Links
        </span>
        {links.map((link, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="https://"
              value={link.url}
              onChange={(event) => {
                const next = links.slice()
                next[index] = { ...link, url: event.target.value }
                onLinks(next)
              }}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Title (optional)"
                value={link.title}
                onChange={(event) => {
                  const next = links.slice()
                  next[index] = { ...link, title: event.target.value }
                  onLinks(next)
                }}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => onLinks(links.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() => onLinks([...links, { url: '', title: '' }])}
        >
          Add a link
        </Button>
      </div>
    </div>
  )
}
