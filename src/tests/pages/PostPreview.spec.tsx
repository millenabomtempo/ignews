import { render, screen } from "@testing-library/react"
import { mocked } from "jest-mock"
import { getPrismicClient } from "../../services/prismic"
import { useSession } from "next-auth/react"

import Post, { getStaticProps } from "../../pages/posts/preview/[slug]"
import { useRouter } from "next/router"

const post = { 
  slug: 'my-new-post', 
  title: 'My New Post', 
  content: '<p>Post content</p>', 
  updatedAt: 'July, 20' 
}

jest.mock('next/router')
jest.mock('next-auth/react')
jest.mock('../../services/prismic')

describe('PostPreview page', () => {
  it('renders correctly', () => {
    const useSessionMocked = mocked(useSession)
    useSessionMocked.mockReturnValueOnce({ data: null, status: 'unauthenticated'})
    
    render(<Post post={post}/>)

    expect(screen.getByText('My New Post')).toBeInTheDocument()
    expect(screen.getByText('Post content')).toBeInTheDocument()
    expect(screen.getByText('Wanna continue reading?')).toBeInTheDocument()
  })

  it('redirects user to full post when user is subscribed', async () => {
    const useRouterMocked = mocked(useRouter)
    const useSessionMocked = mocked(useSession)
    const pushMock = jest.fn()

    useSessionMocked.mockReturnValueOnce(
      { 
        data: { activeSubscription: 'fake-active-subscription'},
        status: "authenticated"
      } as any
    )
    
    useRouterMocked.mockReturnValueOnce({
      push: pushMock
    } as any)
    
    render(<Post post={post}/>)

    expect(pushMock).toHaveBeenCalledWith('/posts/my-new-post')
  })

  it('loads initial data', async () => {
    const getPrismicClientMocked = mocked(getPrismicClient)
    
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

    const response = await getStaticProps({ params: { slug: 'my-new-post' }})

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