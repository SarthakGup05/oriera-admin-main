import React, { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  CodeXml,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo,
  Redo,
  Upload,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import axiosInstance from "@/lib/axiosinstaance";

export default function TipTapEditor({
  value = "",
  onChange,
  placeholder = "Write your story here... Use the toolbar above to format headings, quotes, images, and links.",
  minHeight = "400px",
}) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80 transition-opacity",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: "rounded-xl max-w-full my-6 shadow-md mx-auto block border border-border/50",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none min-h-[${minHeight}] px-6 py-5 text-base leading-relaxed text-foreground font-sans`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
  });

  // Keep editor content in sync when value changes externally (e.g. edit mode initial load)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (value === "" && editor.isEmpty) return;
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  // Handle Link Dialog
  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      " "
    );
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setLinkDialogOpen(true);
  }, [editor]);

  const saveLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkDialogOpen(false);
      return;
    }

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl) && !formattedUrl.startsWith("/") && !formattedUrl.startsWith("#")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (linkText && !editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: formattedUrl })
        .run();
    } else if (linkText) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${formattedUrl}">${linkText}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: formattedUrl })
        .run();
    }

    setLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");
  }, [editor, linkUrl, linkText]);

  // Handle Image Upload to Cloudinary
  const handleContentImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP, GIF)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axiosInstance.post("/blogs/upload-content-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.url && editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: res.data.url, alt: imageAlt || file.name })
          .run();
        toast.success("Image inserted into story!");
        setImageDialogOpen(false);
        setImageUrl("");
        setImageAlt("");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(err.response?.data?.message || "Failed to upload inline image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertImageUrl = () => {
    if (!imageUrl.trim() || !editor) return;
    editor
      .chain()
      .focus()
      .setImage({ src: imageUrl.trim(), alt: imageAlt.trim() || "Blog Image" })
      .run();
    setImageDialogOpen(false);
    setImageUrl("");
    setImageAlt("");
    toast.success("Image added!");
  };

  if (!editor) {
    return (
      <div className="w-full border rounded-xl p-8 flex items-center justify-center min-h-[300px] bg-muted/20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Word count and char count
  const textContent = editor.state.doc.textContent;
  const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = textContent.length;
  const readTimeEst = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="w-full border border-border rounded-xl overflow-hidden bg-card shadow-xs transition-all focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/20">
      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 bg-muted/40 backdrop-blur-md border-b border-border text-foreground">
        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-border/70">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1 (H1)"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2 (H2)"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3 (H3)"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Basic formatting */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/70">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/70">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            active={editor.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists & Blocks */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/70">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Quote Block"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <CodeXml className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider Line"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Media & Links */}
        <div className="flex items-center gap-0.5 px-1 border-r border-border/70">
          <ToolbarButton
            onClick={openLinkDialog}
            active={editor.isActive("link")}
            title="Insert / Edit Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          {editor.isActive("link") && (
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove Link"
            >
              <Unlink className="w-4 h-4 text-destructive" />
            </ToolbarButton>
          )}
          <ToolbarButton
            onClick={() => setImageDialogOpen(true)}
            title="Insert In-Content Image"
          >
            <ImageIcon className="w-4 h-4 text-primary" />
          </ToolbarButton>
        </div>

        {/* History */}
        <div className="flex items-center gap-0.5 pl-1 ml-auto">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* ── Editor Canvas ── */}
      <div className="editor-container relative bg-card">
        <EditorContent editor={editor} />
      </div>

      {/* ── Editor Footer Status Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{wordCount.toLocaleString()} words</span>
          <span>•</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span>•</span>
          <span>~{readTimeEst} min read</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-3 h-3" /> Ready
          </span>
        </div>
      </div>

      {/* ── Link Dialog ── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Insert / Edit Hyperlink</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="link-text">Display Text (optional)</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Click here to read more"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL Target *</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/gallery"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveLink}>Apply Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── In-Content Image Dialog ── */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Insert Image into Content</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="url">Image URL</TabsTrigger>
            </TabsList>

            {/* Upload tab */}
            <TabsContent value="upload" className="space-y-4 pt-4">
              <div>
                <Label>Alt Description (SEO & Accessibility)</Label>
                <Input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g., Destination wedding bride portrait"
                  className="mt-1.5"
                />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-muted/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleContentImageUpload(e.target.files[0]);
                    }
                  }}
                />
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Uploading to Cloudinary...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">Click to select an image</p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* URL tab */}
            <TabsContent value="url" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="img-url">Image Direct URL *</Label>
                <Input
                  id="img-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../photo.jpg"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="img-alt">Alt Description</Label>
                <Input
                  id="img-alt"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g. Sunset photoshoot in Jaipur"
                  className="mt-1.5"
                />
              </div>
              <Button
                onClick={handleInsertImageUrl}
                className="w-full"
                disabled={!imageUrl.trim()}
              >
                Insert Image
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Toolbar Button Helper
function ToolbarButton({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md text-sm font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}
