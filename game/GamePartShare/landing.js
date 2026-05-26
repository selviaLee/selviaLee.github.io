const savedRoomCode = localStorage.getItem("mg_room_code");

if (savedRoomCode) {
  location.href = `room.html?code=${encodeURIComponent(savedRoomCode)}`;
} else {
  document.getElementById("goCreate").addEventListener("click", () => {
    location.href = "nickname.html?mode=create";
  });

  document.getElementById("goJoin").addEventListener("click", () => {
    location.href = "nickname.html?mode=join";
  });
}
