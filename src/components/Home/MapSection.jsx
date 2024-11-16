import React from "react";

const MapSection = ({ bookingData }) => {
  return (
    <div className="w-full md:w-1/2 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden">
      <div className="w-full h-full min-h-[500px]">
        <iframe
          src={`https://www.google.com/maps/embed/v1/directions?origin=${
            bookingData.from ? bookingData.from : "UPES"
          }&destination=${
            bookingData.to
              ? bookingData.to
              : bookingData.from
              ? bookingData.from
              : "UPES"
          }&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&mode=walking&zoom=18`}
          className="h-full w-full min-h-[500px] border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

export default MapSection;
