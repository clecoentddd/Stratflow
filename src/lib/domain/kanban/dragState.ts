let draggingId: string | null = null;

export function setDraggingId(id: string) {
  draggingId = id;
}

export function getDraggingId() {
  return draggingId;
}

export function clearDraggingId() {
  draggingId = null;
}
