import { AiStyle } from "@/components/ai-style-selector";

// Генератор стилизованных изображений "на лету"
export const generateStyleSVG = (styleId: string): string => {
  // Различные стили
  const styles: Record<string, () => string> = {
    style1: () => {
      // Звёздная ночь (Ван Гог)
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="background-color:#0A1744;">
        <ellipse cx="128" cy="85" rx="25" ry="25" fill="#FFF9B5"/>
        <g fill="#FFF9B5">
          <circle cx="80" cy="53" r="2"/>
          <circle cx="186" cy="67" r="2"/>
          <circle cx="320" cy="80" r="2"/>
          <circle cx="400" cy="40" r="2"/>
          <circle cx="133" cy="107" r="2"/>
          <circle cx="293" cy="13" r="1"/>
          <circle cx="213" cy="93" r="2"/>
          <circle cx="346" cy="53" r="1"/>
          <circle cx="453" cy="101" r="2"/>
          <circle cx="266" cy="27" r="1"/>
          <circle cx="506" cy="67" r="1"/>
          <circle cx="27" cy="93" r="1"/>
          <circle cx="426" cy="80" r="2"/>
          <circle cx="53" cy="27" r="1"/>
          <circle cx="240" cy="53" r="1"/>
        </g>
        <g opacity="0.8">
          <path d="M0 107 Q64 80 128 107 T256 107 T384 107 T512 107" stroke="#FFF9B5" stroke-width="3" fill="none"/>
          <path d="M0 160 Q64 120 128 160 T256 160 T384 160 T512 160" stroke="#FFF9B5" stroke-width="4" fill="none"/>
        </g>
        <path d="M0 213 Q128 146 256 213 T512 213 V512 H0 Z" fill="#2E4374"/>
        <path d="M0 240 Q128 173 256 240 T512 240 V512 H0 Z" fill="#1D2951"/>
        <path d="M0 267 Q128 226 256 267 T512 267 V512 H0 Z" fill="#0A1744"/>
        <path d="M0 213 L27 202 L53 219 L80 208 L107 224 L133 208 L160 219 L186 202 L213 219 L240 202 L266 219 L293 208 L320 224 L346 208 L373 219 L400 202 L426 219 L453 202 L480 219 L512 208 V512 H0 Z" fill="#4B5D8C" opacity="0.7"/>
      </svg>
      `;
    },
    style2: () => {
      // Крик (Мунк)
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="background-color:#E28800;">
        <path d="M0 0 L512 0 L512 320 Q384 213 256 320 Q128 427 0 320 Z" fill="#E81E00"/>
        <path d="M0 320 Q128 427 256 320 Q384 213 512 320 L512 512 L0 512 Z" fill="#C89111"/>
        <path d="M207 85 Q256 53 305 85 T256 213 T207 85" fill="#1A110A"/>
        <ellipse cx="256" cy="173" rx="15" ry="20" fill="#E81E00"/>
        <path d="M241 173 Q256 200 271 173" stroke="#1A110A" stroke-width="3" fill="none"/>
        <path d="M216 120 Q236 131 256 120 Q276 131 296 120" stroke="#1A110A" stroke-width="3" fill="none"/>
        <ellipse cx="236" cy="160" rx="5" ry="7" fill="#1A110A"/>
        <ellipse cx="276" cy="160" rx="5" ry="7" fill="#1A110A"/>
        <path d="M128 107 Q171 186 216 120" stroke="#722D00" stroke-width="5" fill="none"/>
        <path d="M384 107 Q341 186 296 120" stroke="#722D00" stroke-width="5" fill="none"/>
      </svg>
      `;
    },
    style3: () => {
      // Композиция (Кандинский)
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="background-color:#FFFFFF;">
        <rect x="53" y="53" width="213" height="213" fill="#E9DC9D"/>
        <rect x="246" y="246" width="213" height="213" fill="#A6C5DE"/>
        <circle cx="160" cy="160" r="80" fill="#DB4642"/>
        <circle cx="352" cy="352" r="80" fill="#1C70B6"/>
        <line x1="0" y1="0" x2="512" y2="512" stroke="#121416" stroke-width="10"/>
        <line x1="512" y1="0" x2="0" y2="512" stroke="#121416" stroke-width="10"/>
        <circle cx="256" cy="256" r="25" fill="#F0DE4D"/>
        <rect x="128" y="246" width="128" height="10" fill="#121416"/>
        <rect x="246" y="128" width="10" height="128" fill="#121416"/>
        <path d="M107 107 L160 53 L213 107 Z" fill="#121416"/>
        <path d="M405 405 L352 459 L299 405 Z" fill="#121416"/>
      </svg>
      `;
    },
    style4: () => {
      // Кубизм (Пикассо)
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="background-color:#F4F0E6;">
        <polygon points="128,107 256,53 384,107 256,160" fill="#BBC8BA"/>
        <polygon points="53,267 154,224 154,352 53,309" fill="#D6C6B1"/>
        <polygon points="458,267 357,224 357,352 458,309" fill="#B5927B"/>
        <polygon points="154,224 256,160 357,224 256,267" fill="#E7D6B9"/>
        <polygon points="154,352 256,267 357,352 256,416" fill="#8A6342"/>
        <rect x="216" y="320" width="80" height="32" fill="#161616"/>
        <ellipse cx="246" cy="267" rx="10" ry="15" fill="#161616"/>
        <ellipse cx="266" cy="267" rx="10" ry="15" fill="#161616"/>
        <path d="M216 299 L246 293 L266 293 L296 299" stroke="#161616" stroke-width="4" fill="none"/>
      </svg>
      `;
    },
    style5: () => {
      // Водяные лилии (Моне)
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="background-color:#A4CCD3;">
        <rect width="512" height="512" fill="#A4CCD3"/>
        <g opacity="0.5">
          <ellipse cx="128" cy="128" rx="64" ry="32" fill="#7FB7C4" transform="rotate(30,128,128)"/>
          <ellipse cx="384" cy="213" rx="80" ry="40" fill="#7FB7C4" transform="rotate(15,384,213)"/>
          <ellipse cx="213" cy="384" rx="96" ry="48" fill="#7FB7C4" transform="rotate(45,213,384)"/>
        </g>
        <g opacity="0.7">
          <circle cx="128" cy="128" r="21" fill="#F2A0A6"/>
          <circle cx="384" cy="213" r="27" fill="#F2A0A6"/>
          <circle cx="213" cy="384" r="32" fill="#F2A0A6"/>
          <circle cx="128" cy="128" r="16" fill="#FFFFFF"/>
          <circle cx="384" cy="213" r="21" fill="#FFFFFF"/>
          <circle cx="213" cy="384" r="24" fill="#FFFFFF"/>
          <circle cx="128" cy="128" r="10" fill="#F6E754"/>
          <circle cx="384" cy="213" r="14" fill="#F6E754"/>
          <circle cx="213" cy="384" r="16" fill="#F6E754"/>
        </g>
        <g opacity="0.3">
          <path d="M96 160 Q112 149 128 160 T160 160" stroke="#326D61" stroke-width="3" fill="none"/>
          <path d="M352 245 Q368 234 384 245 T416 245" stroke="#326D61" stroke-width="3" fill="none"/>
          <path d="M181 416 Q197 405 213 416 T245 416" stroke="#326D61" stroke-width="3" fill="none"/>
        </g>
      </svg>
      `;
    }
  };

  // Возвращаем SVG для указанного стиля или заглушку
  const styleFunc = styles[styleId] || styles.style1;
  return `data:image/svg+xml;utf8,${encodeURIComponent(styleFunc())}`;
};

// Заглушки для стилей
export const placeholderStyles: AiStyle[] = [
  {
    id: 'style1',
    name: 'Звёздная ночь (Ван Гог)',
    imageUrl: generateStyleSVG('style1')
  },
  {
    id: 'style2',
    name: 'Крик (Мунк)',
    imageUrl: generateStyleSVG('style2')
  },
  {
    id: 'style3',
    name: 'Композиция (Кандинский)',
    imageUrl: generateStyleSVG('style3')
  },
  {
    id: 'style4',
    name: 'Кубизм (Пикассо)',
    imageUrl: generateStyleSVG('style4')
  },
  {
    id: 'style5',
    name: 'Водяные лилии (Моне)',
    imageUrl: generateStyleSVG('style5')
  }
];