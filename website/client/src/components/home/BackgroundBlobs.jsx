const blobs = [
  { size: 420, color: "bg-[#90CAF9]", className: "top-[-120px] left-[-140px]" },
  { size: 340, color: "bg-[#A5D6A7]", className: "bottom-[-140px] right-[-160px]" },
];

export default function BackgroundBlobs() {
  return (
    <>
      <div className="education-icons" aria-hidden="true" />
      {blobs.map((blob, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={`blob ${blob.color} ${blob.className}`}
          style={{
            width: blob.size,
            height: blob.size,
            animationDelay: `${index * 3}s`,
          }}
        />
      ))}
    </>
  );
}
