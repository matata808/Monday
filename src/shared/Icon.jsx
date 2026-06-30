const iconPaths = {
  alert:
    "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  arrow: "M7 17 17 7m0 0H8m9 0v9",
  board:
    "M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-13ZM8 7v10m4-10v10m4-10v10",
  check:
    "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  circle: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  cloud:
    "M17.5 19H8a5 5 0 1 1 .9-9.92A7 7 0 0 1 22 12.5 4.5 4.5 0 0 1 17.5 19Z",
  external:
    "M14 4h6v6m0-6-8 8M20 14v4.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H10",
  inbox:
    "M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v12.5A2.75 2.75 0 0 1 17.25 21H6.75A2.75 2.75 0 0 1 4 18.25V5.75Zm0 9.25h4l1.5 2h5l1.5-2h4",
  journal:
    "M6 4.75A2.75 2.75 0 0 1 8.75 2h7.5A2.75 2.75 0 0 1 19 4.75v14.5A2.75 2.75 0 0 1 16.25 22h-7.5A2.75 2.75 0 0 1 6 19.25V4.75ZM9 7h6m-6 4h6m-6 4h4",
  plus: "M12 5v14m-7-7h14",
  spark:
    "m12 3 1.7 5.3H19l-4.3 3.1 1.6 5.2L12 13.4l-4.3 3.2 1.6-5.2L5 8.3h5.3L12 3Z",
  sync:
    "M21 12a9 9 0 0 1-15.5 6.2M3 12a9 9 0 0 1 15.5-6.2M18 3v4h-4M6 21v-4h4",
  trash:
    "M3 6h18m-2 0-.7 13.1A2 2 0 0 1 16.3 21H7.7a2 2 0 0 1-2-1.9L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 4v7m4-7v7",
  up: "m18 15-6-6-6 6",
  down: "m6 9 6 6 6-6",
};

export function Icon({ name, className = "h-4 w-4" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

