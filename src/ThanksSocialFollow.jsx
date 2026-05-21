import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ScanLine } from 'lucide-react';

export const PAP_INSTAGRAM_URL = 'https://www.instagram.com/pap.healthcare/';

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.92 4.92 0 0 1 1.78 1.153 4.92 4.92 0 0 1 1.153 1.78c.163.46.349 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.92 4.92 0 0 1-1.153 1.78 4.92 4.92 0 0 1-1.78 1.153c-.46.163-1.26.349-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.92 4.92 0 0 1-1.78-1.153 4.92 4.92 0 0 1-1.153-1.78c-.163-.46-.349-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.92 4.92 0 0 1 1.153-1.78 4.92 4.92 0 0 1 1.78-1.153c.46-.163 1.26-.349 2.43-.403C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.775.13 4.902.333 4.14.63a6.87 6.87 0 0 0-2.49 1.62A6.87 6.87 0 0 0 .03 4.74C-.267 5.502-.47 6.375-.528 7.652-.586 8.932-.6 9.341-.6 12s.014 3.068.072 4.348c.058 1.277.261 2.15.558 2.912a6.87 6.87 0 0 0 1.62 2.49 6.87 6.87 0 0 0 2.49 1.62c.762.297 1.635.5 2.912.558 1.28.058 1.689.072 4.348.072s3.068-.014 4.348-.072c1.277-.058 2.15-.261 2.912-.558a6.87 6.87 0 0 0 2.49-1.62 6.87 6.87 0 0 0 1.62-2.49c.297-.762.5-1.635.558-2.912.058-1.28.072-1.689.072-4.348s-.014-3.068-.072-4.348c-.058-1.277-.261-2.15-.558-2.912a6.87 6.87 0 0 0-1.62-2.49 6.87 6.87 0 0 0-2.49-1.62C19.498.333 18.625.13 17.348.072 16.068.014 15.659 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

export function ThanksSocialFollow() {
  return (
    <section className="thanks-social" aria-labelledby="thanks-social-heading">
      <div className="thanks-social-card">
        <header className="thanks-social-head">
          <span className="thanks-social-icon" aria-hidden>
            <InstagramGlyph />
          </span>
          <h2 id="thanks-social-heading" className="thanks-social-heading">
            Siga a gente no Instagram
          </h2>
          <p className="thanks-social-subheading">Novidades, cases e saúde digital</p>
        </header>

        <div className="thanks-social-qr">
          <p className="thanks-social-scan">
            <ScanLine size={20} strokeWidth={2.25} aria-hidden />
            Escaneie para seguir
          </p>
          <div className="thanks-qr-wrap">
            <QRCodeSVG
              value={PAP_INSTAGRAM_URL}
              size={200}
              level="M"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#12345a"
              title="QR Code do Instagram @pap.healthcare"
            />
          </div>
        </div>

        <footer className="thanks-social-foot">
          <p className="thanks-social-handle">@pap.healthcare</p>
        </footer>
      </div>
    </section>
  );
}
