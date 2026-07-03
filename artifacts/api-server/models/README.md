# Local ONNX model directory

Drop your custom-trained YOLO model here, exported to ONNX format, to switch
the detection engine from GPT-4o Vision / simulation over to your own model.

## Files

- `best.onnx` — required. Your trained YOLOv8 (or compatible) model exported
  with `yolo export model=best.pt format=onnx`. Standard Ultralytics export
  shape is expected: input `[1,3,640,640]`, output `[1, 4+numClasses, 8400]`.
- `labels.json` — optional. A JSON array of class names in the same order
  used during training, e.g. `["pothole", "plastic_waste"]`. If omitted, the
  server assumes `["pothole", "plastic_waste", "other_litter"]`. Class names
  are matched loosely (substring match on "pothole", "plastic", "litter" /
  "trash" / "garbage"), so slightly different naming still works.

## Priority order

The server checks for a usable model in this order, per request:

1. `models/best.onnx` present → runs local ONNX inference (this directory)
2. `OPENAI_API_KEY` set → GPT-4o Vision
3. Neither → randomized simulation fallback (for demos)

No restart is required to pick up label changes on the next detection
request handled after the model is first loaded, but if you swap
`best.onnx` itself, restart the API server so it reloads the new weights.
