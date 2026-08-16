import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API from "../api/axios";
import RichTextEditor from "./richTextEditor";

import "./EditPost.css";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const [currentImage, setCurrentImage] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        setError("");

        // Your backend currently returns all posts.
        const response = await API.get("/posts");

        const foundPost = response.data.find(
          (post) => String(post._id) === String(id),
        );

        if (!foundPost) {
          setError("Post not found.");
          return;
        }

        setTitle(foundPost.title || "");
        setContent(foundPost.content || "");
        setCategory(foundPost.category || "");
        setCurrentImage(foundPost.image || "");
      } catch (err) {
        console.error("Failed to load post:", err);

        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load this post.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  useEffect(() => {
    return () => {
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  function handleContentChange(html) {
    setContent(html);
  }

  function handleImageChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }

    setError("");
    setNewImage(selectedFile);
    setNewImagePreview(URL.createObjectURL(selectedFile));
  }

  function removeNewImage() {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }

    setNewImage(null);
    setNewImagePreview("");
  }

  function isEditorEmpty(html) {
    if (!html) {
      return true;
    }

    const temporaryElement = document.createElement("div");
    temporaryElement.innerHTML = html;

    const plainText =
      temporaryElement.textContent ||
      temporaryElement.innerText ||
      "";

    return plainText.trim().length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a post title.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    if (isEditorEmpty(content)) {
      setError("Please enter content for the post.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("content", content);
      formData.append("category", category);

      if (newImage) {
        formData.append("image", newImage);
      }

      await API.put(`/posts/${id}`, formData);

      navigate(`/posts/${id}`);
    } catch (err) {
      console.error("Failed to update post:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update the post.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="edit-post-page">
        <p className="edit-post-message">Loading post...</p>
      </main>
    );
  }

  if (error === "Post not found.") {
    return (
      <main className="edit-post-page">
        <p className="edit-post-message">{error}</p>

        <button
          type="button"
          className="edit-cancel-button"
          onClick={() => navigate("/")}
        >
          Return Home
        </button>
      </main>
    );
  }

  return (
    <main className="edit-post-page">
      <section className="edit-container">
        <div className="edit-post-header">
          <h1>Edit Post</h1>
          <p>Update the title, category, content, or featured image.</p>
        </div>

        {error && (
          <div className="edit-post-error" role="alert">
            {error}
          </div>
        )}

        <form
          className="edit-post-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <div className="form-group">
            <label htmlFor="edit-title">Title</label>

            <input
              id="edit-title"
              name="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter the post title"
              maxLength={150}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-category">Category</label>

            <select
              id="edit-category"
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              <option value="Other">Other</option>
              <option value="Web Development">Web Development</option>
              <option value="AI">AI</option>
              <option value="Projects">Projects</option>
              <option value="Career">Career</option>
              <option value="Personal">Personal</option>
              <option value="Technology">Technology</option>
              <option value="News">News</option>
            </select>
          </div>

          <div className="form-group">
            <label>Content</label>

            <RichTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Update your blog post..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-image">Featured image</label>

            {currentImage && !newImagePreview && (
              <div className="edit-image-preview-container">
                <p className="edit-image-label">Current image</p>

                <img
                  src={currentImage}
                  alt={title || "Current post"}
                  className="edit-image-preview"
                />
              </div>
            )}

            {newImagePreview && (
              <div className="edit-image-preview-container">
                <p className="edit-image-label">New image preview</p>

                <img
                  src={newImagePreview}
                  alt="New post preview"
                  className="edit-image-preview"
                />

                <button
                  type="button"
                  className="remove-new-image-button"
                  onClick={removeNewImage}
                >
                  Remove new image
                </button>
              </div>
            )}

            <input
              id="edit-image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="edit-post-actions">
            <button
              type="submit"
              className="edit-submit-button"
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Post"}
            </button>
                        <button
              type="button"
              className="edit-cancel-button"
              onClick={() => navigate(`/posts/${id}`)}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}