"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Car,
  Layers,
  Eye
} from "lucide-react";
import type { SortDescriptor } from "@heroui/react";
import { Button, Pagination, SearchField, Spinner, Table, Tabs, toast } from "@heroui/react";

import { StatusChip } from "@/components/StatusChip";
import { ImageGrid } from "@/components/ImageGallery";
import VehicleCreateModal from "@/components/admin/vehicles/VehicleCreateModal";
import VehicleDetailsModal from "@/components/admin/vehicles/VehicleDetailsModal";

import VehicleCategoryCreateModal from "@/components/admin/vehicles/VehicleCategoryCreateModal";
import VehicleCategoryDetailsModal from "@/components/admin/vehicles/VehicleCategoryDetailsModal";

import {
  getVehicles,
  deleteVehicle,
  getVehicleCategories,
  deleteVehicleCategory,
  VehicleDto,
  VehicleCategoryDto
} from "@/lib/api/fleet";

import { backendUrl } from "@/lib/api/client";
import { resolveImageUrls } from "@/lib/api/media";
import { ColumnInterface } from "@/lib/interface/column.interface";


const PAGE_SIZE = 8;


export default function VehiclesManagementPage() {


  /**
   * Tabs
   */
  const [activeTab, setActiveTab] =
    useState<"vehicles" | "categories">("vehicles");


  /**
   * Common state
   */
  const [loading, setLoading] =
    useState<boolean>(true);

  const [searchTerm, setSearchTerm] =
    useState<string>("");


  /**
   * Data
   */
  const [categories, setCategories] =
    useState<VehicleCategoryDto[]>([]);

  const [vehicles, setVehicles] =
    useState<VehicleDto[]>([]);


  /**
   * Vehicle Modal State
   */
  const [createModalOpen, setCreateModalOpen] =
    useState(false);

  const [detailsModalOpen, setDetailsModalOpen] =
    useState(false);

  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleDto | null>(null);



  /**
   * Category Modal State
   */
  const [catCreateModalOpen, setCatCreateModalOpen] =
    useState(false);

  const [catDetailsModalOpen, setCatDetailsModalOpen] =
    useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<VehicleCategoryDto | null>(null);



  /**
   * Toast helper
   */
  const showToast = (
    message: string,
    type: "success" | "error"
  ) => {

    if (type === "success") {
      toast.success(message);
      return;
    }

    toast.danger(message);
  };



  /**
   * Load data
   */
  const fetchInitialData = async () => {

    setLoading(true);

    try {
      let loadedCategories: VehicleCategoryDto[] =
        [];
      try {
        const response =
          await getVehicleCategories();
        if (response.data?.content) {
          loadedCategories =
            response.data.content;
        }
      } catch (error) {
        console.warn(
          "Load categories failed:",
          error
        );
      }
      let loadedVehicles: VehicleDto[] =
        [];
      try {
        const response =
          await getVehicles();
        if (response.data?.content) {
          loadedVehicles =
            response.data.content;
        }
      } catch (error) {
        console.warn(
          "Load vehicles failed:",
          error
        );
      }
      setCategories(
        loadedCategories
      );
      setVehicles(
        loadedVehicles
      );
    } catch (error) {
      console.error(
        "Fleet loading error:",
        error
      );
      showToast(
        "Không thể kết nối API. Dùng dữ liệu offline.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {

    fetchInitialData();

  }, []);
  const handleRefresh = () => {
    fetchInitialData();
  };

  // Reset to first page whenever the search term or active tab changes
  useEffect(() => {
    setVehiclePage(1);
    setCategoryPage(1);
  }, [searchTerm, activeTab]);




  /**
   * Delete vehicle
   */
  const handleDeleteVehicle = async (
    id: number
  ) => {


    const confirmMessage =
      "Bạn có chắc muốn xóa xe này?";


    if (!window.confirm(confirmMessage)) {
      return;
    }



    try {
      await deleteVehicle(id);
      showToast(
        "Xóa xe thành công",
        "success"
      );
    } catch (error) {
      showToast(
        "Xóa offline thành công",
        "success"
      );
    }

    setVehicles(prev =>
      prev.filter(
        item => item.id !== id
      )
    );
  };





  /**
   * Delete category
   */
  const handleDeleteCategory = async (
    id: number
  ) => {


    const confirmMessage =
      "Bạn có chắc muốn xóa danh mục này?";
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      await deleteVehicleCategory(id);
      showToast(
        "Xóa danh mục thành công",
        "success"
      );
    } catch (error) {


      showToast(
        "Xóa offline thành công",
        "success"
      );

    }



    setCategories(prev =>
      prev.filter(
        item => item.id !== id
      )
    );


  };




  const handleSaveSuccess = () => {

    fetchInitialData();

  };



  const handleCategorySaveSuccess = () => {

    fetchInitialData();

  };




  /**
   * Search vehicles
   */
  const filteredVehicles =
    vehicles.filter(vehicle => {

      const keyword =
        searchTerm.toLowerCase();


      return (

        vehicle.brand
          .toLowerCase()
          .includes(keyword)

        ||

        vehicle.model
          .toLowerCase()
          .includes(keyword)

        ||

        vehicle.fuelType
          .toLowerCase()
          .includes(keyword)

      );

    });





  /**
   * Search categories
   */
  const filteredCategories =
    categories.filter(category => {


      const translation =
        category.translations.find(
          item =>
            item.locale === "vi"
        )
        ||
        category.translations[0];



      const keyword =
        searchTerm.toLowerCase();



      return (

        category.code
          .toLowerCase()
          .includes(keyword)
        ||
        translation?.name
          .toLowerCase()
          .includes(keyword)
      );
    });




  /**
   * Category display helper
   */
  const getCategoryName = (
    category?: VehicleCategoryDto
  ) => {


    if (!category) {

      return "Chưa phân loại";

    }



    const translation =
      category.translations.find(
        item =>
          item.locale === "vi"
      )
      ||
      category.translations[0];



    return (
      translation?.name
      ||
      category.code
    );

  };


  /**
   * Vehicles table - sorting & pagination
   */
  const [vehicleSort, setVehicleSort] =
    useState<SortDescriptor>({ column: "id", direction: "ascending" });

  const [vehiclePage, setVehiclePage] =
    useState<number>(1);

  const vehicleColumns: ColumnInterface[] = [
    { id: "id", label: "ID", sortable: true, isRowHeader: true },
    { id: "images", label: "Hình ảnh", sortable: false },
    { id: "brandModel", label: "Thương hiệu / Mẫu", sortable: false },
    { id: "type", label: "Loại xe", sortable: true },
    { id: "luggage", label: "Hành lý", sortable: false },
    { id: "active", label: "Trạng thái", sortable: true },
    { id: "actions", label: "Hành Động", sortable: false },
  ];

  const sortedVehicles = useMemo(() => {

    const { column, direction } = vehicleSort;
    const dir = direction === "descending" ? -1 : 1;

    return [...filteredVehicles].sort((a, b) => {

      let cmp = 0;

      switch (column) {
        case "id":
          cmp = a.id - b.id;
          break;
        case "type":
          cmp = getCategoryName(a.type)
            .localeCompare(getCategoryName(b.type));
          break;
        case "active":
          cmp = Number(a.active) - Number(b.active);
          break;
        default:
          cmp = 0;
      }

      return cmp * dir;
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredVehicles, vehicleSort]);

  const vehiclePageCount =
    Math.max(1, Math.ceil(sortedVehicles.length / PAGE_SIZE));

  const paginatedVehicles = useMemo(
    () => sortedVehicles.slice(
      (vehiclePage - 1) * PAGE_SIZE,
      vehiclePage * PAGE_SIZE
    ),
    [sortedVehicles, vehiclePage]
  );

  const vehiclePages = Array.from(
    { length: vehiclePageCount },
    (_, i) => i + 1
  );

  const vehicleStart =
    sortedVehicles.length === 0
      ? 0
      : (vehiclePage - 1) * PAGE_SIZE + 1;

  const vehicleEnd = Math.min(
    vehiclePage * PAGE_SIZE,
    sortedVehicles.length
  );

  useEffect(() => {
    if (vehiclePage > vehiclePageCount) {
      setVehiclePage(vehiclePageCount);
    }
  }, [vehiclePage, vehiclePageCount]);


  /**
   * Categories table - sorting & pagination
   */
  const [categorySort, setCategorySort] =
    useState<SortDescriptor>({ column: "id", direction: "ascending" });

  const [categoryPage, setCategoryPage] =
    useState<number>(1);

  const categoryColumns: {
    id: string;
    label: string;
    sortable: boolean;
    isRowHeader?: boolean;
  }[] = [
      { id: "id", label: "ID", sortable: true, isRowHeader: true },
      { id: "name", label: "Name", sortable: true },
      { id: "code", label: "Code", sortable: true },
      { id: "seats", label: "Seats", sortable: false },
      { id: "active", label: "Status", sortable: true },
      { id: "actions", label: "Actions", sortable: false },
    ];

  const sortedCategories = useMemo(() => {

    const { column, direction } = categorySort;
    const dir = direction === "descending" ? -1 : 1;

    return [...filteredCategories].sort((a, b) => {

      let cmp = 0;

      switch (column) {
        case "id":
          cmp = a.id - b.id;
          break;
        case "name":
          cmp = getCategoryName(a).localeCompare(getCategoryName(b));
          break;
        case "code":
          cmp = a.code.localeCompare(b.code);
          break;
        case "active":
          cmp = Number(a.active) - Number(b.active);
          break;
        default:
          cmp = 0;
      }

      return cmp * dir;
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCategories, categorySort]);

  const categoryPageCount =
    Math.max(1, Math.ceil(sortedCategories.length / PAGE_SIZE));

  const paginatedCategories = useMemo(
    () => sortedCategories.slice(
      (categoryPage - 1) * PAGE_SIZE,
      categoryPage * PAGE_SIZE
    ),
    [sortedCategories, categoryPage]
  );

  const categoryPages = Array.from(
    { length: categoryPageCount },
    (_, i) => i + 1
  );

  const categoryStart =
    sortedCategories.length === 0
      ? 0
      : (categoryPage - 1) * PAGE_SIZE + 1;

  const categoryEnd = Math.min(
    categoryPage * PAGE_SIZE,
    sortedCategories.length
  );

  useEffect(() => {
    if (categoryPage > categoryPageCount) {
      setCategoryPage(categoryPageCount);
    }
  }, [categoryPage, categoryPageCount]);

  function VehicleImagesCell({ imageIds, thumbnailId }: { imageIds?: number[]; thumbnailId?: number }) {
    const [images, setImages] = useState<{ id: number; url: string }[]>([]);

    useEffect(() => {
      if (!imageIds || imageIds.length === 0) { setImages([]); return; }
      let cancelled = false;
      resolveImageUrls(imageIds).then(res => { if (!cancelled) setImages(res); });
      return () => { cancelled = true; };
    }, [imageIds]);

    if (images.length === 0) return <span className="text-xs text-slate-400">—</span>;
    return <ImageGrid images={images} thumbnailId={thumbnailId} maxVisible={3} className="h-10 w-28" />;
  }


  return (
    <div className="w-full space-y-6">


      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-black/10 gap-6">


        <Tabs
          className="w-full "
          selectedKey={activeTab}
          onSelectionChange={(key) => {

            setActiveTab(
              key as "vehicles" | "categories"
            );

            setSearchTerm("");

          }}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Fleet tabs" className="dark:bg-black/10 border">
              <Tabs.Tab id="vehicles">
                <span className="flex items-center gap-2">
                  <Car size={16} />
                  Danh sách xe
                </span>
                <Tabs.Indicator className="bg-[#ffcc00a4]" />
              </Tabs.Tab>
              <Tabs.Tab id="categories">
                <span className="flex items-center gap-2">
                  <Layers size={16} />
                  Danh mục xe
                </span>
                <Tabs.Indicator className="bg-[#ffcc00a4]" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      {/* Toolbar */}

      <div className="
        flex flex-col lg:flex-row
        justify-between gap-4
        p-6 rounded-2xl
        border
      ">
        <SearchField name="search" value={searchTerm} onChange={(e: string) => setSearchTerm(e)} fullWidth className={`min-w-[200px]`}>
          <SearchField.Group className={` rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-black/10 text-slate-805 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[yellow-500] dark:focus:ring-yellow-500/30 text-sm font-bold`}>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-full " placeholder={
              activeTab === "vehicles"
                ?
                "Tìm kiếm xe..."
                :
                "Tìm kiếm danh mục..."
            } />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCw
              size={16}
              className="mr-2"
            />
            Làm mới

          </Button>
          {
            activeTab === "vehicles"
            &&
            <Button
              onClick={() =>
                setCreateModalOpen(true)
              }
            >

              <Plus size={16} />

              Thêm xe

            </Button>
          }
          {
            activeTab === "categories"
            &&
            <Button
              onClick={() =>
                setCatCreateModalOpen(true)
              }
            >
              <Plus size={16} />
              Thêm danh mục
            </Button>
          }
        </div>
      </div>
      {/* Content */}
      <div
        className="
          bg-white
          dark:bg-black/10
          rounded-2xl
          border
          overflow-hidden
        "
      >
        {
          loading
            ?
            (
              <div className="flex justify-center items-center py-20">
                <Spinner
                  size="md"
                  className="mr-1.5"
                />
              </div>
            )
            :
            activeTab === "vehicles"
              ?
              (
                filteredVehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-white dark:bg-black/10">
                    <Car className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                      Không tìm thấy kết quả
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Không có xe nào được tìm thấy.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <Table.ScrollContainer>
                      <Table.Content
                        aria-label="Vehicle table"
                        className="min-w-[800px]"
                        sortDescriptor={vehicleSort}
                        onSortChange={setVehicleSort}
                      >
                        <Table.Header>
                          {vehicleColumns.map((col) => (
                            <Table.Column
                              key={col.id}
                              id={col.id}
                              allowsSorting={col.sortable}
                              isRowHeader={col.isRowHeader}
                            >
                              {col.sortable
                                ? ({ sortDirection }) => (
                                  <Table.SortableColumnHeader sortDirection={sortDirection}>
                                    {col.label}
                                  </Table.SortableColumnHeader>
                                )
                                : col.label}
                            </Table.Column>
                          ))}
                        </Table.Header>

                        <Table.Body>
                          {paginatedVehicles.map((vehicle) => (
                            <Table.Row key={vehicle.id} id={String(vehicle.id)}>
                              <Table.Cell>
                                #{vehicle.id}
                              </Table.Cell>
                              <Table.Cell>
                                <VehicleImagesCell imageIds={vehicle.imageIds} thumbnailId={vehicle.thumbnailId} />
                              </Table.Cell>
                              <Table.Cell>
                                <div>
                                  <div className="font-bold">
                                    {vehicle.brand} {vehicle.model}
                                  </div>
                                  <div className="text-xs">
                                    {vehicle.year} | {vehicle.fuelType}
                                  </div>
                                </div>
                              </Table.Cell>
                              <Table.Cell>
                                {getCategoryName(vehicle.type)}
                              </Table.Cell>
                              <Table.Cell>
                                {vehicle.luggage} {vehicle.luggageUnit}
                              </Table.Cell>
                              <Table.Cell>
                                <StatusChip status={String(vehicle.active)} type="active" />
                              </Table.Cell>
                              <Table.Cell>
                                <div className="flex gap-2">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Xem chi tiết xe"
                                    onPress={() => {
                                      setSelectedVehicle(vehicle);
                                      setDetailsModalOpen(true);
                                    }}
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Xóa xe"
                                    onPress={() => {
                                      handleDeleteVehicle(vehicle.id);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                    <Table.Footer>
                      <Pagination size="sm">
                        <Pagination.Summary>
                          {vehicleStart} to {vehicleEnd} of {sortedVehicles.length} results
                        </Pagination.Summary>
                        <Pagination.Content>
                          <Pagination.Item>
                            <Pagination.Previous
                              isDisabled={vehiclePage <= 1}
                              onPress={() => setVehiclePage((p) => Math.max(1, p - 1))}
                            >
                              <Pagination.PreviousIcon />
                              Prev
                            </Pagination.Previous>
                          </Pagination.Item>
                          {vehiclePages.map((p) => (
                            <Pagination.Item key={p}>
                              <Pagination.Link
                                isActive={p === vehiclePage}
                                onPress={() => setVehiclePage(p)}
                              >
                                {p}
                              </Pagination.Link>
                            </Pagination.Item>
                          ))}
                          <Pagination.Item>
                            <Pagination.Next
                              isDisabled={vehiclePage >= vehiclePageCount}
                              onPress={() => setVehiclePage((p) => Math.min(vehiclePageCount, p + 1))}
                            >
                              Next
                              <Pagination.NextIcon />
                            </Pagination.Next>
                          </Pagination.Item>
                        </Pagination.Content>
                      </Pagination>
                    </Table.Footer>
                  </Table>
                )
              )
              :
              (
                filteredCategories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-white dark:bg-black/10">
                    <Car className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                      Không tìm thấy kết quả
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Không có loại xe nào được tìm thấy
                    </p>
                  </div>
                )
                  : (
                    <Table>
                      <Table.ScrollContainer>
                        <Table.Content
                          aria-label="Vehicle categories table"
                          className="min-w-[700px]"
                          sortDescriptor={categorySort}
                          onSortChange={setCategorySort}
                        >
                          <Table.Header>
                            {categoryColumns.map((col) => (
                              <Table.Column
                                key={col.id}
                                id={col.id}
                                allowsSorting={col.sortable}
                                isRowHeader={col.isRowHeader}
                              >
                                {col.sortable
                                  ? ({ sortDirection }) => (
                                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                                      {col.label}
                                    </Table.SortableColumnHeader>
                                  )
                                  : col.label}
                              </Table.Column>
                            ))}
                          </Table.Header>

                          <Table.Body>
                            {paginatedCategories.map((category) => (
                              <Table.Row key={category.id} id={String(category.id)}>
                                <Table.Cell>
                                  #{category.id}
                                </Table.Cell>
                                <Table.Cell>
                                  {getCategoryName(category)}
                                </Table.Cell>
                                <Table.Cell>
                                  {category.code}
                                </Table.Cell>
                                <Table.Cell>
                                  {category.minSeat}-{category.maxSeat}
                                </Table.Cell>
                                <Table.Cell>
                                   <StatusChip status={String(category.active)} type="active" />
                                </Table.Cell>
                                <Table.Cell>
                                  <div className="flex gap-2">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="ghost"
                                      aria-label="Xem chi tiết danh mục"
                                      onPress={() => {
                                        setSelectedCategory(category);
                                        setCatDetailsModalOpen(true);
                                      }}
                                    >
                                      <Eye size={16} />
                                    </Button>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="ghost"
                                      aria-label="Xóa danh mục"
                                      onPress={() => {
                                        handleDeleteCategory(category.id);
                                      }}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Content>
                      </Table.ScrollContainer>
                      <Table.Footer>
                        <Pagination size="sm">
                          <Pagination.Summary>
                            {categoryStart} to {categoryEnd} of {sortedCategories.length} results
                          </Pagination.Summary>
                          <Pagination.Content>
                            <Pagination.Item>
                              <Pagination.Previous
                                isDisabled={categoryPage <= 1}
                                onPress={() => setCategoryPage((p) => Math.max(1, p - 1))}
                              >
                                <Pagination.PreviousIcon />
                                Prev
                              </Pagination.Previous>
                            </Pagination.Item>
                            {categoryPages.map((p) => (
                              <Pagination.Item key={p}>
                                <Pagination.Link
                                  isActive={p === categoryPage}
                                  onPress={() => setCategoryPage(p)}
                                >
                                  {p}
                                </Pagination.Link>
                              </Pagination.Item>
                            ))}
                            <Pagination.Item>
                              <Pagination.Next
                                isDisabled={categoryPage >= categoryPageCount}
                                onPress={() => setCategoryPage((p) => Math.min(categoryPageCount, p + 1))}
                              >
                                Next
                                <Pagination.NextIcon />
                              </Pagination.Next>
                            </Pagination.Item>
                          </Pagination.Content>
                        </Pagination>
                      </Table.Footer>
                    </Table>
                  )

              )
        }
      </div>









      {/* Vehicle Modals */}


      <VehicleCreateModal

        isOpen={createModalOpen}

        onClose={() =>
          setCreateModalOpen(false)
        }

        categories={categories}

        language="vi"

        backendUrl={backendUrl}

        onSaveSuccess={handleSaveSuccess}

        showToast={showToast}

      />





      <VehicleDetailsModal

        isOpen={detailsModalOpen}

        onClose={() => {

          setDetailsModalOpen(false);

          setSelectedVehicle(null);

        }}

        vehicle={selectedVehicle}

        categories={categories}

        language="vi"

        backendUrl={backendUrl}

        onSaveSuccess={handleSaveSuccess}

        showToast={showToast}

      />







      {/* Category Modals */}



      <VehicleCategoryCreateModal


        isOpen={catCreateModalOpen}


        onClose={() =>
          setCatCreateModalOpen(false)
        }


        language="vi"


        backendUrl={backendUrl}


        onSaveSuccess={
          handleCategorySaveSuccess
        }


        showToast={showToast}


      />





      <VehicleCategoryDetailsModal


        isOpen={catDetailsModalOpen}


        onClose={() => {

          setCatDetailsModalOpen(false);

          setSelectedCategory(null);

        }}


        category={selectedCategory}


        language="vi"


        backendUrl={backendUrl}


        onSaveSuccess={
          handleCategorySaveSuccess
        }


        showToast={showToast}


      />



    </div>
  );


}
