import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDB } from '@/lib/db';
import { BlogPost } from '@/lib/entities/BlogPost';
import { Label } from '@/lib/entities/Label';
import { QueryHandler, QueryOptions } from '@/lib/utils-server';

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);
    const db = await getDB();
    const blogPostRepository = db.getRepository(BlogPost);
    const queryHandler = new QueryHandler(blogPostRepository);

    // Set up role-based field selection with dot notation
    queryHandler.setRoleFields('public', [
      'id', 'title', 'excerpt', 'date', 'readTime', 'views', 'isFeatured', 'slug'
    ]);

    queryHandler.setRoleFields('admin', [
      'id', 'title', 'content', 'excerpt', 'date', 'readTime', 'views', 'isFeatured', 'slug', 'metaTags'
    ]);

    const url = new URL(req.url);
    const options: QueryOptions<BlogPost> = {
      page: parseInt(url.searchParams.get('page') || '1', 10),
      limit: parseInt(url.searchParams.get('limit') || '10', 10),
      sort: url.searchParams.get('sort') || undefined,
      search: url.searchParams.get('search') || undefined,
      searchFields: ['title'],
      filters: url.searchParams.get('label') 
        ? { labels: [{ name: url.searchParams.get('label') }] }
        : undefined,
    };

    const result = await queryHandler.filterMulti(options, ['author', 'author.avatar', 'labels'], user?.role);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: 'Error fetching blog posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDB();
    const blogPostRepository = db.getRepository(BlogPost);
    const labelRepository = db.getRepository(Label);

    const reqBody = await req.json();
    const { title, content, date, excerpt, readTime, isFeatured, labels: postLabels, metaTags } = reqBody;

    const errors = await BlogPost.validate(reqBody);
    
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const labels = await labelRepository.findByIds(postLabels.map((label: any) => label.id));

    const blogPost = blogPostRepository.create({
      title,
      content,
      date,
      readTime,
      excerpt,
      isFeatured,
      author: { id: user.id },
      labels,
      slug: title.toLowerCase().replace(/ /g, '-'),
      metaTags: metaTags || {},
    });

    await blogPostRepository.save(blogPost);
    return NextResponse.json(blogPost);
  } catch (error) {
    return NextResponse.json({ message: 'Error creating blog post' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDB();
    const blogPostRepository = db.getRepository(BlogPost);
    const labelRepository = db.getRepository(Label);

    const { id, title, content, date, readTime, isFeatured, labelIds, metaTags } = await req.json();

    const blogPost = await blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'labels'],
    });

    if (!blogPost) {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 });
    }

    if (blogPost.author.id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const labels = await labelRepository.findByIds(labelIds);

    blogPost.title = title;
    blogPost.content = content;
    blogPost.date = date;
    blogPost.readTime = readTime;
    blogPost.isFeatured = isFeatured;
    blogPost.labels = labels;
    blogPost.metaTags = metaTags;

    const errors = await BlogPost.validate(blogPost);
    
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    await blogPostRepository.save(blogPost);
    return NextResponse.json(blogPost);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating blog post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSession(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDB();
    const blogPostRepository = db.getRepository(BlogPost);

    const { id } = await req.json();

    const blogPost = await blogPostRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!blogPost) {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 });
    }

    if (blogPost.author.id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await blogPostRepository.remove(blogPost);
    return NextResponse.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting blog post' }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, PUT, DELETE'
    }
  });
}