package com.example.demo.helpers;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

public class FileHelper {

	public static String upload(MultipartFile file, String folder) throws Exception {

		// tạo folder nếu chưa tồn tại
		File directory = new File(folder);

		if (!directory.exists()) {
			directory.mkdirs();
		}

		String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

		Path path = Paths.get(folder, fileName);

		Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

		return fileName;
	}
}