# Training
Prepare YOLO-format `train/`, `valid/`, `test/` folders, copy `data.yaml.example` to `data.yaml`, set the classes, run `python train.py`, then copy `runs/detect/train/weights/best.pt` to `backend/ai_models/garbage.pt` (garbage) or `backend/ai_models/waterlogging.pt` (waterlogging, e.g. a Roboflow "waterlogging" dataset with one class named `waterlogging`).
