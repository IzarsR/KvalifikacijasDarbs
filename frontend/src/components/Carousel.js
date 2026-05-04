import React, { useState } from 'react';
import './Carousel.css';

function Carousel({ children, visibleItemsCount = 1 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsArray = Array.isArray(children) ? children : [children];
  const totalItems = itemsArray.length;

  const goToSlide = (index) => {
    setCurrentIndex((index + totalItems) % totalItems);
  };

  const nextSlide = () => {
    goToSlide(currentIndex + 1);
  };

  const prevSlide = () => {
    goToSlide(currentIndex - 1);
  };

  return (
    <div className="carousel">
      <button className="carousel-btn carousel-btn-prev" onClick={prevSlide}>
        <span>‹</span>
      </button>

      <div className="carousel-viewport">
        <div className="carousel-track" style={{ transform: `translateX(-${currentIndex * (100 / visibleItemsCount)}%)` }}>
          {itemsArray.map((item, idx) => (
            <div key={idx} className="carousel-item">
              {item}
            </div>
          ))}
        </div>
      </div>

      <button className="carousel-btn carousel-btn-next" onClick={nextSlide}>
        <span>›</span>
      </button>

      <div className="carousel-indicators">
        {itemsArray.map((_, idx) => (
          <button
            key={idx}
            className={`carousel-indicator ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousel;

