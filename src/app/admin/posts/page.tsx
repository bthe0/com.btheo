"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/app/contexts/UserContext";
import dynamic from "next/dynamic";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { confirm } from "@/lib/utils-client";
import { FiFilePlus, FiEye, FiTrash2, FiEdit } from "react-icons/fi";
import Modal from "@/app/components/Modal";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import { FormProvider } from "@/app/components/FormProvider";
import Accordion from "@/app/components/Accordion";
import * as yup from "yup";
import moment from "moment";
import Switch from "@/app/components/Switch";
import Label from "@/app/components/Label";

const MdEditor = dynamic(() => import("react-markdown-editor-lite"), {
  ssr: false,
});

import "react-markdown-editor-lite/lib/index.css";
import Table from "@/app/components/Table";

interface Label {
  id: number;
  name: string;
  slug: string;
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  readTime: string;
  isFeatured: boolean;
  author: {
    id: number;
    name: string;
  };
  labels: Label[];
  metaTags: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
}

const BlogPostsPage: React.FC = () => {
  const { user } = useUser();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogMeta, setBlogMeta] = useState<any>({});
  const [labels, setLabels] = useState<{ value: string; label: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [blogPost, setBlogPost] = useState<Partial<BlogPost>>({
    title: "",
    content: "",
    excerpt: "",
    date: new Date().toISOString().split("T")[0],
    readTime: "",
    isFeatured: false,
    labels: [],
    metaTags: {},
  });
  const [error, setError] = useState<string | null>(null);

  const mdParser = new MarkdownIt({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, str).value;
        } catch (__) {}
      }
      return "";
    },
  });

  const calculateReadTime = useCallback((content: string): string => {
    const wordsPerMinute = 200;
    content = content || "";
    const wordCount = content.trim().split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  }, []);

  useEffect(() => {
    fetchBlogPosts();
    fetchLabels();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const posts = await response.json();
        setBlogPosts(posts.data);
        setBlogMeta(posts.meta);
      } else {
        throw new Error("Failed to fetch blog posts");
      }
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      setError("Failed to fetch blog posts. Please try again.");
    }
  };

  const fetchLabels = async () => {
    try {
      const response = await fetch("/api/labels");
      if (response.ok) {
        const data = await response.json();
        setLabels(
          data.map((label: Label) => ({
            value: label.id,
            label: label.name,
          }))
        );
      } else {
        throw new Error("Failed to fetch labels");
      }
    } catch (error) {
      console.error("Failed to fetch labels:", error);
      setError("Failed to fetch labels. Please try again.");
    }
  };

  const handleBlogPost = async (values = {}) => {
    try {
      const readTime = calculateReadTime(values.content);
      const response = await fetch("/api/posts", {
        method: blogPost.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...blogPost,
          ...values,
          readTime,
          content: values.content || "",
          excerpt:
            values.excerpt || (values.content || "").slice(0, 200) + "...",
          status: values.status ? "published" : "draft",
          date: values.date || new Date().toISOString().split("T")[0],
          labels:
            values.labels?.map((label: any) => ({ id: label.value })) || [],
          metaTags: {
            ...blogPost.metaTags,
            ...values.metaTags,
            keywords:
              values.metaTags?.keywords?.map((keyword) => keyword.value) || [],
          },
        }),
      });

      if (response.ok) {
        await fetchBlogPosts();
        setBlogPost({
          title: "",
          content: "",
          excerpt: "",
          date: new Date().toISOString().split("T")[0],
          readTime: "",
          isFeatured: false,
          labels: [],
          metaTags: {},
        });
        setShowModal(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to update blog post");
      }
    } catch (error) {
      console.error("Failed to update blog post:", error);
      setError(
        error.message || "Failed to update blog post. Please try again."
      );
    }
  };

  const setBlogPostForEdit = (post: any) => {
    const newPost = {
      ...post,
    };

    newPost.labels = post.labels.map((label: any) => ({
      value: label.id,
      label: label.name,
    }));

    if (newPost.metaTags?.keywords) {
      post.metaTags.keywords = post.metaTags.keywords.map((keyword: any) => ({
        value: keyword,
        label: keyword,
      }));
    }

    setBlogPost(newPost);
  };

  const handleDeleteBlogPost = async (post: any) => {
    const ok = await confirm({
      title: "Are you sure?",
      message: `Do you really want to delete this blog post (${post.title})?`,
    });

    if (!ok) {
      return;
    }

    try {
      const response = await fetch("/api/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id }),
      });
      if (response.ok) {
        await fetchBlogPosts();
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete blog post");
      }
    } catch (error) {
      console.error("Failed to delete blog post:", error);
      setError(
        error.message || "Failed to delete blog post. Please try again."
      );
    }
  };

  const handleEditorChange = ({ text }: { text: string }) => {
    setBlogPost({ ...blogPost, content: text });
  };

  return (
    <div>
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        fullScreen
        title={`${blogPost.id ? "Edit Post" : "Add Post"}`}
      >
        <div className={"mt-md"}>
          <FormProvider
            onSubmit={handleBlogPost}
            initialValues={blogPost.id ? blogPost : {}}
            validationSchema={{
              title: {
                rules: [
                  yup.string().required("Title is required"),
                  yup.string().max(100, "Title must be at most 100 characters"),
                ],
              },
            }}
          >
            {({ values, submitForm, setFieldValue }) => {
              return (
                <div className="row editor-row">
                  <div className="col-lg-8">
                    <div className="h-full">
                      <MdEditor
                        style={{
                          height: "100%",
                          minHeight: 500,
                          marginBottom: 30,
                        }}
                        autoFocus
                        renderHTML={(text) => mdParser.render(text)}
                        onChange={(value) =>
                          setFieldValue("content", value.text)
                        }
                        value={values.content}
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 xs-mt-md">
                    <div>
                      <div className="row">
                        <div className="col-lg-6">
                          <div>
                            <Button
                              type="submit"
                              color="primary"
                              fullWidth
                              className="mb-lg"
                              onClick={submitForm}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div>
                            <Button
                              type="submit"
                              color="primary"
                              fullWidth
                              inverted
                              className="mb-lg"
                            >
                              <FiEye className="mr-xs" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Input
                        name="title"
                        type="text"
                        maxLength={100}
                        placeholder="Title *"
                      />
                      <Input
                        name="excerpt"
                        type="textarea"
                        placeholder="Excerpt"
                        maxLength={200}
                      />
                      <div className="flex">
                        <Input
                          type="switch"
                          label="Featured"
                          name="isFeatured"
                        />
                        <Input type="switch" label="Published" name="status" />
                      </div>
                      <Input
                        type="date"
                        name="date"
                        placeholder="Created date"
                      />
                      <Input
                        type="react-select"
                        name="labels"
                        label="Labels"
                        placeholder=""
                        options={labels}
                        isMulti
                      />
                      <Accordion title="SEO">
                        <Input
                          name="metaTags.title"
                          type="text"
                          placeholder="Title"
                        />
                        <Input
                          name="metaTags.description"
                          type="textarea"
                          placeholder="Description"
                        />
                        <Input
                          name="metaTags.keywords"
                          type="react-select-creatable"
                          label="Keywords"
                          placeholder=""
                          isMulti
                        />
                        <Input
                          name="metaTags.ogImage"
                          type="text"
                          placeholder="OG Image"
                        />
                        <Input
                          name="metaTags.ogTitle"
                          type="text"
                          placeholder="OG Title"
                        />
                        <Input
                          name="metaTags.ogDescription"
                          type="text"
                          placeholder="OG Description"
                        />
                      </Accordion>
                    </div>
                  </div>
                </div>
              );
            }}
          </FormProvider>
        </div>
      </Modal>
      <div className="row">
        <div className="col-6">
          <h3 className="m-0">Posts</h3>
        </div>
        <div className="col-6 text-right">
          <div>
            <Button
              onClick={() => {
                setShowModal(true);
                setBlogPost({});
              }}
            >
              <FiFilePlus className={"mr-xs"} /> Create new post
            </Button>
          </div>
        </div>
      </div>
      <Table
        fields={[
          {
            name: "id",
            key: "id",
            label: "ID",
            sortable: true,
          },
          {
            name: "Title",
            key: "title",
            label: "Title",
            sortable: true,
            style: {
              maxWidth: 120,
            },
          },
          {
            name: "Date",
            key: "date",
            label: "Date",
            transform: (value: string) => moment(value).format("DD MMM YYYY"),
            sortable: true,
          },
          {
            name: "Author",
            key: "author",
            label: "Author",
            sortable: true,
          },
          {
            name: "Labels",
            key: "labels",
            label: "Labels",
            sortable: false,
            transform: (value: any) =>
              value.map((label: any) => (
                <Label key={label.id}>{label.name}</Label>
              )),
          },
          {
            name: "Is Featured",
            key: "isFeatured",
            label: "Is Featured",
            transform: (value) => <Switch checked={value} />,
            sortable: true,
          },
          {
            name: "Published",
            key: "status",
            label: "Published",
            transform: (value) => <Switch checked={value === "published"} />,
            sortable: true,
          },
        ]}
        actions={[
          {
            key: "edit",
            label: (
              <>
                <FiEdit className="mr-xs" />
                Edit
              </>
            ),
            onClick: (item: any) => {
              setBlogPostForEdit(item);
              setShowModal(true);
            },
          },
          {
            key: "delete",
            labelClassName: "error",
            label: (
              <>
                <FiTrash2 className="mr-xs" />
                Delete
              </>
            ),
            onClick: (item: any) => handleDeleteBlogPost(item),
          },
        ]}
        meta={blogMeta}
        data={blogPosts}
      />
    </div>
  );
};

export default BlogPostsPage;
