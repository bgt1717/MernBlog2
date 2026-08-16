import { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/axios";
import RichTextEditor from "./richTextEditor";

import "./CreatePost.css";

export default function CreatePost() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleContentChange(html) {
    setFormData((current) => ({
      ...current,
      content: html,
    }));
  }

  function handleImageChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setImage(null);
      setImagePreview("");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    setError("");
    setImage(selectedFile);
    setImagePreview(URL.createObjectURL(selectedFile));
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview("");
  }

  function isEditorEmpty(html) {
    if (!html) {
      return true;
    }

    const plainText = html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    return plainText.length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!formData.title.trim()) {
      setError("Please enter a post title.");
      return;
    }

    if (isEditorEmpty(formData.content)) {
      setError("Please enter some content for the post.");
      return;
    }

    try {
      setLoading(true);

      const postData = new FormData();

      postData.append("title", formData.title.trim());
      postData.append("category", formData.category.trim());
      postData.append("content", formData.content);

      if (image) {
        postData.append("image", image);
      }

      const response = await API.post("/posts", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const createdPost = response.data;

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      navigate(`/posts/${createdPost._id}`);
    } catch (err) {
      console.error("Create post error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to create the post. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="create-post-page">
      <section className="create-post-container">
        <div className="create-post-header">
          <h1>Create Post</h1>
          <p>Write and publish a new blog post.</p>
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form
          className="create-post-form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <div className="form-group">
            <label htmlFor="title">Title</label>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter the post title"
              maxLength={150}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>

            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
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
            <label htmlFor="post-image">Featured image</label>

            <input
              id="post-image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {imagePreview && (
              <div className="image-preview-container">
                <img
                  className="image-preview"
                  src={imagePreview}
                  alt="Selected post preview"
                />

                <button
                  className="remove-image-button"
                  type="button"
                  onClick={removeImage}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Content</label>

            <RichTextEditor
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Write your blog post..."
            />
          </div>

          <div className="create-post-actions">

            <button
              className="publish-post-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Post"}
            </button>
              <button
              className="cancel-post-button"
              type="button"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}