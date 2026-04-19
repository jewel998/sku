export default function AboutPage() {
  return (
    <div className="card">
      <div className="section-title">About SKU Label Maker</div>
      <p className="section-note">
        A mobile-friendly PWA that generates product label PDFs using `pdf-lib` in the browser. Each
        label renders on its own small page, and you can install this app locally on your phone.
      </p>
      <div className="illustration-box">
        <h2>Features</h2>
        <ul>
          <li>Live form-driven label generation</li>
          <li>PDF export with Comfortaa font embedded</li>
          <li>PWA install support for mobile use</li>
          <li>Brand/category/location mapping via config</li>
          <li>GitHub Pages deployment ready</li>
        </ul>
      </div>
    </div>
  );
}
