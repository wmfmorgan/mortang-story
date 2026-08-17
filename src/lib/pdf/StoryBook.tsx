import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatFuzzyDate, storyToFuzzyDate } from '../dates'
import type { Media, Person, PerspectiveWithAuthor, Story } from '../../types/database'

export type PdfStory = Story & {
  people: Person[]
  perspectives: PerspectiveWithAuthor[]
  media: Media[]
  photoUrls: { id: string; url: string }[]
}

type Props = {
  familyName: string
  title: string
  subtitle?: string
  stories: PdfStory[]
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 54,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#2b241d',
    backgroundColor: '#fbf7ef',
  },
  coverTitle: {
    marginTop: 160,
    fontFamily: 'Times-Bold',
    fontSize: 28,
    textAlign: 'center',
  },
  coverSub: {
    marginTop: 14,
    fontSize: 13,
    textAlign: 'center',
    color: '#5c5248',
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 54,
    right: 54,
    fontSize: 9,
    color: '#5c5248',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storyTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  meta: {
    fontSize: 10,
    color: '#5c5248',
    marginBottom: 12,
  },
  tellingLabel: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  photo: {
    width: '48%',
    height: 160,
    objectFit: 'cover',
    marginBottom: 8,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  link: {
    fontSize: 10,
    color: '#7a2e2e',
    marginTop: 3,
  },
})

function Footer({ familyName }: { familyName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>The {familyName} stories</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

function StoryBlock({ story }: { story: PdfStory }) {
  const names = story.people.map((person) => person.display_name).join(', ')
  const links = story.media.filter((item) => item.kind === 'link' && item.url)
  return (
    <View>
      <Text style={styles.storyTitle}>{story.title}</Text>
      <Text style={styles.meta}>
        {formatFuzzyDate(storyToFuzzyDate(story))}
        {story.place_name ? `  ·  ${story.place_name}` : ''}
        {names ? `  ·  ${names}` : ''}
      </Text>
      {story.perspectives.map((perspective) => (
        <View key={perspective.id}>
          <Text style={styles.tellingLabel}>
            {`As Remembered by ${perspective.author.display_name}`}
          </Text>
          <Text style={styles.body}>{perspective.body}</Text>
        </View>
      ))}
      {story.photoUrls.length > 0 ? (
        <View style={styles.photos}>
          {story.photoUrls.map((photo) => (
            <Image key={photo.id} src={photo.url} style={styles.photo} />
          ))}
        </View>
      ) : null}
      {links.map((link) => (
        <Text key={link.id} style={styles.link}>
          {link.title || link.url}
        </Text>
      ))}
    </View>
  )
}

export function StoryBook({ familyName, title, subtitle, stories }: Props) {
  return (
    <Document title={title} author={familyName}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>{title}</Text>
        {subtitle ? <Text style={styles.coverSub}>{subtitle}</Text> : null}
        <Footer familyName={familyName} />
      </Page>
      {stories.map((story) => (
        <Page key={story.id} size="A4" style={styles.page} wrap>
          <StoryBlock story={story} />
          <Footer familyName={familyName} />
        </Page>
      ))}
    </Document>
  )
}
