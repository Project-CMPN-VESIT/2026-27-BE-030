"""Download FER-2013 (official Training / PublicTest / PrivateTest splits) and cache it as uint8 arrays."""
import io
import os
import urllib.request

import numpy as np
import pandas as pd
from PIL import Image

from common import DATA, EMOTIONS

REPO = "https://huggingface.co/datasets/Aaryan333/fer2013_train_publicTest_privateTest/resolve/main/data/"
FILES = {
    "train": "train-00000-of-00001-5eab84e1c6a2fc27.parquet",
    "publicTest": "publicTest-00000-of-00001-f41bb7384b8aad6e.parquet",
    "privateTest": "privateTest-00000-of-00001-4b8a0715cf1b7560.parquet",
}
# Published FER-2013 class counts, used to confirm the mirror is the real dataset and split.
EXPECTED_TRAIN = [3995, 436, 4097, 7215, 4830, 3171, 4965]


def main():
    os.makedirs(DATA, exist_ok=True)
    for split, fname in FILES.items():
        path = os.path.join(DATA, fname)
        if not os.path.exists(path):
            print("downloading", fname)
            urllib.request.urlretrieve(REPO + fname, path)
        df = pd.read_parquet(path)
        x = np.stack([np.array(Image.open(io.BytesIO(img["bytes"])).convert("L")) for img in df["image"]])
        y = df["label"].to_numpy().astype(np.int64)
        assert x.shape[1:] == (48, 48), x.shape
        counts = np.bincount(y, minlength=7).tolist()
        print(f"{split:12s} {x.shape[0]:6d} images  " + "  ".join(f"{e}={c}" for e, c in zip(EMOTIONS, counts)))
        if split == "train":
            assert counts == EXPECTED_TRAIN, f"unexpected train class counts {counts}"
        np.savez_compressed(os.path.join(DATA, f"{split}.npz"), x=x, y=y)


if __name__ == "__main__":
    main()
