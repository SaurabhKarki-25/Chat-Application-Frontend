export default function AudioMessage({ src }) {
  return (
    <audio
      controls
      className="w-56 h-8 rounded-full"
      src={src}
    />
  );
}
