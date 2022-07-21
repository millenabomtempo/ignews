import { render, screen } from "@testing-library/react"
import { mocked } from "jest-mock"
import { getPrismicClient } from "../../services/prismic"

import Post, { getServerSideProps } from "../../pages/posts/[slug]"
import { getSession, useSession } from "next-auth/react"

const post = { 
  slug: 'my-new-post', 
  title: 'My New Post', 
  content: '<p>Post content</p>', 
  updatedAt: 'July, 20' 
}

jest.mock('next-auth/react')
jest.mock('../../services/prismic')

describe('Posts page', () => {
  it('renders correctly', () => {
    render(<Post post={post}/>)

    expect(screen.getByText('My New Post')).toBeInTheDocument()
    expect(screen.getByText('Post content')).toBeInTheDocument()
  })

  it('redirects user if no subcription is found', async () => {
    const getSessionMocked = mocked(getSession)
    getSessionMocked.mockResolvedValueOnce(null)

    const response = await getServerSideProps({ params: { slug: 'my-new-post' }} as any)

    expect(response).toEqual(
      expect.objectContaining({
        redirect: expect.objectContaining({
          destination: '/',
        })
      })
    )
  })

  it('loads initial data', async () => {
    const getSessionMocked = mocked(getSession)
    const getPrismicClientMocked = mocked(getPrismicClient)
    
    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: 'fake-active-subscription'
    } as any)

    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [
            { type: 'heading', text: 'My new post' }
          ],
          content: [
            { type: 'paragraph', text: 'Post content' }
          ]
        },
        last_publication_date: '07-01-2022'
      })
    } as any)

    const response = await getServerSideProps({ params: { slug: 'my-new-post' }} as any)

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: 'my-new-post',
            title: 'My new post',
            content: '<p>Post content</p>',
            updatedAt: '01 de julho de 2022'
          }
        }
      })
    )

  })
})