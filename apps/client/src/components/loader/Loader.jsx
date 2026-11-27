/*
 * From Uiverse.io by mobinkakei - https://uiverse.io/mobinkakei/grumpy-turtle-41
 * MIT License, Copyright (c) mobinkakei (Mobeen)
 */
import "./Loader.css";

const Loader = ({ className = "" }) => (
  <div
    className={`ohmic-loader ${className}`.trim()}
    role="status"
    aria-label="Loading"
  >
    <div className="ohmic-loader__circle ohmic-loader__circle--1" />
    <div className="ohmic-loader__circle ohmic-loader__circle--2" />
    <div className="ohmic-loader__circle ohmic-loader__circle--3" />
    <div className="ohmic-loader__shadow ohmic-loader__shadow--1" />
    <div className="ohmic-loader__shadow ohmic-loader__shadow--2" />
    <div className="ohmic-loader__shadow ohmic-loader__shadow--3" />
  </div>
);

export default Loader;