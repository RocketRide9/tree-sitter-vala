#!/usr/bin/env -S vala --pkg gio-2.0

async void display_jpeg(string fnam) {
    // Load JPEG in a background thread and display it when loaded
    // [...]
}

void main()
{
    display_jpeg.begin("test.jpg");
    display_jpeg.begin("test.jpg", (obj, res) => {
        display_jpeg.end(res);
    });
}
