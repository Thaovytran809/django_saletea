document.addEventListener("DOMContentLoaded", function () {
  try {
    console.log("Dữ liệu ban đầu:", data);
    
    const clean_data = data.map((item) => {
      if (!item["Thoi_gian"]) return { ...item, created_date: null, gio: null };
  
      const date = new Date(item["Thoi_gian"]);
      const created_date = date.toISOString().split("T")[0];
      // Lấy giờ theo múi giờ chuẩn để tránh lệch giờ
      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const day = date.getUTCDate().toString().padStart(2, "0");
  
      // Định dạng thời gian về "YYYY-MM-DD HH:MM:SS"
      const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
      // Lấy khung giờ dạng "8:00-8:59"
      const gio = `${parseInt(hours)}:00-${parseInt(hours)}:59`;
  
      return {
          ...item,
          created_date, // Thời gian chuẩn
          gio, // Khung giờ
      };
  });
  
  console.log(clean_data);  

    // Vẽ biểu đồ
    drawChart6(clean_data);
  } catch (error) {
    console.error("Lỗi xử lý dữ liệu:", error);
  }
});

const drawChart6 = (data) => {
    
  
    // Đặt kích thước cho SVG
    const width = 1200;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    const chartWidth = width - margin.left - margin.right - 180;
    const chartHeight = height - margin.top - margin.bottom;
  
    // Xử lý dữ liệu
    
    const uniqueDates = new Set(data.map(d => d.created_date));
    const numDays = uniqueDates.size;  // Số ngày trong dữ liệu

    const groupedData = d3.rollups(
        data.filter((d) => d.gio !== null), 
        (values) => {
            const total = d3.sum(values, (d) => d["total"]);
            const count = d3.sum(values, (d) => d["sL"]);
            
            // Xác định số ngày có xuất hiện khung giờ này
            const uniqueDatesForGio = new Set(values.map(d => d.created_date));
            const numDaysForGio = uniqueDatesForGio.size; // Số ngày có khung giờ này
            
            return { total, count, numDaysForGio };
        },
        (d) => d.gio // Nhóm theo `gio`
    );

    // Chuyển dữ liệu nhóm sang mảng và sắp xếp theo `gio`
    const processingData = Array.from(groupedData, ([gio, { total, count, numDaysForGio }]) => ({
        gio,
        TBDT: numDaysForGio > 0 ? total / numDaysForGio : 0, // Chia theo số ngày có xuất hiện khung giờ
        TBSL: numDaysForGio > 0 ? count / numDaysForGio : 0  // Chia theo số ngày có xuất hiện khung giờ
    })).sort((a, b) => parseInt(a.gio) - parseInt(b.gio));

    console.log("Số ngày trong dữ liệu:", numDays);
    console.log("processingData:", processingData);
  
    // Tạo SVG
    const svg = d3
      .select("#q6")
      .attr("width", width)
      .attr("height", height);
  
    // Scales
    const xScale = d3
      .scaleBand()
      .domain(processingData.map((d) => d.gio))
      .range([0, chartWidth])
      .padding(0.2);
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(processingData, (d) => d.TBDT)])
      .range([chartHeight, 0]);
  
    const colorScale = d3.scaleOrdinal(d3.schemeSet2)
    .domain(processingData.map((d) => d.gio))
   
    // Dịch SVG
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 100},${margin.top})`);
  
    // Dịch trục
    g.append("g").call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));
    
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))

    // Thêm các thanh cột
    g.selectAll(".bar")
      .data(processingData)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.gio))
      .attr("y", (d) => yScale(d.TBDT))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => chartHeight - yScale(d.TBDT))
      .attr("fill", (d) => colorScale(d.gio))
      .on("mouseover", (event, d) => {
        // Hiển thị tooltip khi hover
        const tooltip = d3.select("#tooltip6");
        tooltip
          .style("opacity", 1)
          .html(
            `Khung giờ: ${d.gio}<br>Doanh số bán TB: ${(d.TBDT).toFixed(0)} VNĐ<br>Số lượng bán TB: ${(d.TBSL).toFixed(0)} SKUs`
          )
          .style("left", `${event.pageX + 10}px`) // Vị trí tooltip theo chiều ngang
          .style("top", `${event.pageY - 28}px`); // Vị trí tooltip theo chiều dọc
      })
      .on("mouseout", () => {
        // Ẩn tooltip khi chuột ra khỏi thanh
        d3.select("#tooltip6").style("opacity", 0);
      })
    // Tiêu đề
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Doanh số bán hàng trung bình theo Khung giờ");
    
    // Thêm label cho mỗi cột
    g.selectAll(".label")
    .data(processingData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.gio) + xScale.bandwidth() / 2) // Đặt nhãn ở giữa cột
    .attr("y", (d) => yScale(d.TBDT) - 5) // Đặt nhãn ở phía trên cột
    .attr("text-anchor", "middle") // Căn giữa nhãn
    .style("fill", "black") // Màu chữ
    .style("font-size", "10px") // Cỡ chữ
    .text((d) => (d.TBDT).toFixed(0) + " VNĐ"); // Nội dung nhãn (tổng số)
    
  };

