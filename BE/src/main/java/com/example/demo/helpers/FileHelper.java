package com.example.demo.helpers;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

public class FileHelper {

	private FileHelper() {
	}

	public static String upload(MultipartFile file, String folder) throws IOException {

		File directory = new File(folder);

		if (!directory.exists()) {
			directory.mkdirs();
		}

		String originalFileName = file.getOriginalFilename();

		String extension = "";

		if (originalFileName != null && originalFileName.contains(".")) {
			extension = originalFileName.substring(originalFileName.lastIndexOf("."));
		}

		String fileName = UUID.randomUUID() + extension;

		Path destination = Paths.get(folder, fileName);

		Files.copy(
				file.getInputStream(),
				destination,
				StandardCopyOption.REPLACE_EXISTING);

		return fileName;
	}

}