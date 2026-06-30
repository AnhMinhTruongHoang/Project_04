"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DashboardTableToolbar from "@/components/dashboard/components/DashboardTableToolbar";
import {
  createCategory,
  deleteCategoryApi,
  getCategoryId,
  updateCategory,
} from "@/utils/api";
import { useToast } from "@/utils/toast";
import { GestureOutlined } from "@mui/icons-material";

type Props = {
  categories: ICategory[];
  accessToken?: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
};

const slugify = (value: string) => {
  return value
    .trim()
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
};

const CategoriesTable = ({ categories, accessToken }: Props) => {
  const router = useRouter();
  const toast = useToast();

  const [searchValue, setSearchValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(
    null
  );
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const [confirmCategory, setConfirmCategory] = useState<ICategory | null>(
    null
  );

  const filteredCategories = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) return categories;

    return categories.filter((category) => {
      return [category.name, category.slug, category.description]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });
  }, [categories, searchValue]);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEditDialog = (category: ICategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
    });
    setOpenForm(true);
  };

  const closeFormDialog = () => {
    if (saving) return;

    setOpenForm(false);
    setEditingCategory(null);
    setForm(emptyForm);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => {
      const shouldAutoSlug =
        !prev.slug || prev.slug === slugify(prev.name || "");

      return {
        ...prev,
        name: value,
        slug: shouldAutoSlug ? slugify(value) : prev.slug,
      };
    });
  };

  const saveCategory = async () => {
    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    const categoryId = getCategoryId(editingCategory);

    const body: ICreateCategory | IUpdateCategory = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
    };

    setSaving(true);

    const res = editingCategory
      ? await updateCategory(categoryId, body, accessToken)
      : await createCategory(body as ICreateCategory, accessToken);

    setSaving(false);

    if (res?.data || res?.statusCode === 200 || res?.statusCode === 201) {
      toast.success(
        editingCategory
          ? "Update category successfully."
          : "Create category successfully."
      );

      closeFormDialog();
      router.refresh();
      return;
    }

    toast.error(res?.message || "Save category failed.");
  };

  const removeCategory = async (category: ICategory) => {
    const categoryId = getCategoryId(category);

    if (!categoryId) {
      toast.error("Category not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    setDeletingId(categoryId);

    const res = await deleteCategoryApi(categoryId, accessToken);

    setDeletingId("");

    if (res?.data || res?.statusCode === 200) {
      toast.success("Delete category successfully.");
      router.refresh();
      return;
    }

    toast.error(res?.message || "Delete category failed.");
  };

  const handleDeleteCategory = (category: ICategory) => {
    const categoryId = getCategoryId(category);

    if (!categoryId) {
      toast.error("Category not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    setConfirmCategory(category);
  };

  const columns: GridColDef<ICategory>[] = [
    {
      field: "name",
      headerName: "Category",
      flex: 1.3,
      minWidth: 260,
      sortable: true,
      renderCell: (params) => {
        const category = params.row;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                backgroundColor: "rgba(255,85,0,0.14)",
                color: "#ff5500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GestureOutlined />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                title={category.name}
                sx={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {category.name || "Unknown"}
              </Typography>

              <Typography
                title={category.description}
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {category.description || "No description"}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "slug",
      headerName: "Slug",
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.row.slug || "unknown"}
          size="small"
          sx={{
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.08)",
            fontWeight: 800,
          }}
        />
      ),
    },
    {
      field: "trackCount",
      headerName: "Tracks",
      width: 110,
      align: "center",
      headerAlign: "center",
      valueGetter: (params) => params.row.trackCount ?? 0,
      renderCell: (params) => (
        <Chip
          label={params.row.trackCount ?? 0}
          size="small"
          sx={{
            color: "#ffffff",
            backgroundColor: "rgba(255,85,0,0.14)",
            fontWeight: 900,
          }}
        />
      ),
    },
    {
      field: "isDeleted",
      headerName: "Status",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const isDeleted = Boolean(params.row.isDeleted);

        return (
          <Chip
            label={isDeleted ? "Deleted" : "Active"}
            size="small"
            sx={{
              color: "#ffffff",
              backgroundColor: isDeleted
                ? "rgba(255,77,79,0.18)"
                : "rgba(82,196,26,0.18)",
              fontWeight: 900,
            }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      width: 150,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const category = params.row;
        const categoryId = getCategoryId(category);

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Edit category">
              <IconButton
                onClick={() => openEditDialog(category)}
                size="small"
                sx={{
                  color: "#9a9a9a",
                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete category">
              <IconButton
                onClick={() => handleDeleteCategory(category)}
                disabled={deletingId === categoryId}
                size="small"
                sx={{
                  color: "#ff5a5a",
                  "&:hover": {
                    backgroundColor: "rgba(255,90,90,0.12)",
                  },
                }}
              >
                <DeleteRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <DashboardTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreateDialog}
          sx={{
            height: 40,
            borderRadius: 999,
            backgroundColor: "#ff5500",
            color: "#ffffff",
            fontWeight: 900,
            px: 2.4,
            whiteSpace: "nowrap",
            "&:hover": {
              backgroundColor: "#ff6a1f",
            },
          }}
        >
          Add Category
        </Button>
      </Box>

      <Box
        sx={{
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "#111314",
          border: "1px solid rgba(255,255,255,0.08)",

          "& .MuiDataGrid-root": {
            border: "none",
            color: "#ffffff",
            backgroundColor: "#111314",
          },

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#181A1B",
            color: "#ffffff",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 900,
          },

          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            color: "#ffffff",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(255,255,255,0.035)",
          },

          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#181A1B",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "#ffffff",
          },

          "& .MuiTablePagination-root": {
            color: "#ffffff",
          },

          "& .MuiSvgIcon-root": {
            color: "inherit",
          },

          "& .MuiDataGrid-overlay": {
            backgroundColor: "#111314",
            color: "#9a9a9a",
            fontWeight: 800,
          },
        }}
      >
        <DataGrid
          rows={filteredCategories}
          columns={columns}
          getRowId={(row) => getCategoryId(row)}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 20, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
                page: 0,
              },
            },
          }}
        />
      </Box>

      <Dialog
        open={openForm}
        onClose={closeFormDialog}
        PaperProps={{
          sx: {
            backgroundColor: "#181A1B",
            color: "#ffffff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
            minWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editingCategory ? "Edit category" : "Add category"}
        </DialogTitle>

        <DialogContent sx={{ pt: "8px !important" }}>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{
                sx: { color: "#9a9a9a" },
              }}
              InputProps={{
                sx: {
                  color: "#ffffff",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.16)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.28)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ff5500",
                  },
                },
              }}
            />

            <TextField
              label="Slug"
              value={form.slug}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  slug: slugify(event.target.value),
                }))
              }
              fullWidth
              size="small"
              InputLabelProps={{
                sx: { color: "#9a9a9a" },
              }}
              InputProps={{
                sx: {
                  color: "#ffffff",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.16)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.28)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ff5500",
                  },
                },
              }}
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              fullWidth
              multiline
              minRows={3}
              size="small"
              InputLabelProps={{
                sx: { color: "#9a9a9a" },
              }}
              InputProps={{
                sx: {
                  color: "#ffffff",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.16)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.28)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ff5500",
                  },
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeFormDialog}
            disabled={saving}
            sx={{
              color: "#cfcfcf",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={saving}
            onClick={saveCategory}
            sx={{
              backgroundColor: "#ff5500",
              color: "#ffffff",
              fontWeight: 900,

              "&:hover": {
                backgroundColor: "#ff6a1f",
              },
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!confirmCategory}
        onClose={() => setConfirmCategory(null)}
        PaperProps={{
          sx: {
            backgroundColor: "#181A1B",
            color: "#ffffff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
            minWidth: 380,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Delete category?</DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#bdbdbd", fontSize: 14 }}>
            Are you sure you want to delete{" "}
            <Box component="span" sx={{ color: "#ffffff", fontWeight: 900 }}>
              {confirmCategory?.name}
            </Box>
            ?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmCategory(null)}
            sx={{
              color: "#cfcfcf",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={async () => {
              const selectedCategory = confirmCategory;
              setConfirmCategory(null);

              if (selectedCategory) {
                await removeCategory(selectedCategory);
              }
            }}
            sx={{
              backgroundColor: "#ff4d4f",
              color: "#ffffff",
              fontWeight: 900,

              "&:hover": {
                backgroundColor: "#ff2f32",
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesTable;
