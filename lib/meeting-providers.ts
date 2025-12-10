/**
 * Meeting Provider Interface and Implementations
 * Handles generation of meeting links for different platforms
 */

export interface MeetingLink {
  url: string
  provider: 'google' | 'zoom' | 'default'
}

export interface MeetingProvider {
  name: string
  generateLink(options: MeetingOptions): Promise<MeetingLink | null>
}

export interface MeetingOptions {
  title: string
  startTime: Date
  endTime: Date
  description?: string
  attendees?: string[]
}

/**
 * Default Meeting Provider
 * Returns a pre-configured default link from professor settings
 */
export class DefaultMeetingProvider implements MeetingProvider {
  name = 'default'
  private defaultLink: string | null

  constructor(defaultLink?: string | null) {
    this.defaultLink = defaultLink || null
  }

  async generateLink(_options: MeetingOptions): Promise<MeetingLink | null> {
    if (!this.defaultLink) {
      return null
    }

    return {
      url: this.defaultLink,
      provider: 'default'
    }
  }
}

/**
 * Google Meet Provider
 * Creates Google Calendar events with Meet links
 * Requires OAuth setup with Google Calendar API
 */
export class GoogleMeetProvider implements MeetingProvider {
  name = 'google'
  private accessToken: string | null

  constructor(accessToken?: string | null) {
    this.accessToken = accessToken || null
  }

  async generateLink(options: MeetingOptions): Promise<MeetingLink | null> {
    if (!this.accessToken) {
      console.warn('Google Meet: No access token configured')
      return null
    }

    try {
      const event = {
        summary: options.title,
        description: options.description || '',
        start: {
          dateTime: options.startTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: options.endTime.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        conferenceData: {
          createRequest: {
            requestId: `mentoria-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        attendees: options.attendees?.map(email => ({ email })) || []
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Google Calendar API error:', error)
        return null
      }

      const data = await response.json()
      const meetLink = data.conferenceData?.entryPoints?.find(
        (ep: { entryPointType: string }) => ep.entryPointType === 'video'
      )?.uri

      if (meetLink) {
        return {
          url: meetLink,
          provider: 'google'
        }
      }

      return null
    } catch (error) {
      console.error('Error creating Google Meet:', error)
      return null
    }
  }
}

/**
 * Zoom Provider
 * Creates Zoom meetings via API
 * Requires OAuth setup with Zoom API
 */
export class ZoomMeetingProvider implements MeetingProvider {
  name = 'zoom'
  private accessToken: string | null

  constructor(accessToken?: string | null) {
    this.accessToken = accessToken || null
  }

  async generateLink(options: MeetingOptions): Promise<MeetingLink | null> {
    if (!this.accessToken) {
      console.warn('Zoom: No access token configured')
      return null
    }

    try {
      const meeting = {
        topic: options.title,
        type: 2, // Scheduled meeting
        start_time: options.startTime.toISOString(),
        duration: Math.ceil((options.endTime.getTime() - options.startTime.getTime()) / 60000),
        timezone: 'America/Sao_Paulo',
        agenda: options.description || '',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true
        }
      }

      const response = await fetch(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(meeting)
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Zoom API error:', error)
        return null
      }

      const data = await response.json()

      if (data.join_url) {
        return {
          url: data.join_url,
          provider: 'zoom'
        }
      }

      return null
    } catch (error) {
      console.error('Error creating Zoom meeting:', error)
      return null
    }
  }
}

/**
 * Factory function to get the appropriate meeting provider
 */
export function getMeetingProvider(
  provider: 'google' | 'zoom' | 'default',
  credentials?: {
    accessToken?: string | null
    defaultLink?: string | null
  }
): MeetingProvider {
  switch (provider) {
    case 'google':
      return new GoogleMeetProvider(credentials?.accessToken)
    case 'zoom':
      return new ZoomMeetingProvider(credentials?.accessToken)
    case 'default':
    default:
      return new DefaultMeetingProvider(credentials?.defaultLink)
  }
}

/**
 * Generate a meeting link using the specified provider
 * Falls back to default link if provider fails
 */
export async function generateMeetingLink(
  provider: 'google' | 'zoom' | 'default',
  options: MeetingOptions,
  credentials?: {
    accessToken?: string | null
    defaultLink?: string | null
  }
): Promise<MeetingLink | null> {
  const meetingProvider = getMeetingProvider(provider, credentials)
  const link = await meetingProvider.generateLink(options)

  // Fallback to default if provider fails
  if (!link && provider !== 'default' && credentials?.defaultLink) {
    const defaultProvider = new DefaultMeetingProvider(credentials.defaultLink)
    return defaultProvider.generateLink(options)
  }

  return link
}
