export default function MediaPreview({ media, onClose }) {
  if (!media) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white">
        ✕
      </button>

      {media.type === "image" && (
        <img src={media.fileUrl} className="max-h-[90%]" />
      )}

      {media.type === "video" && (
        <video controls className="max-h-[90%]" src={media.fileUrl} />
      )}
    </div>
  );
}
