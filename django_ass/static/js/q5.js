document.addEventListener("DOMContentLoaded", function () {
  try {
    console.log("Dữ liệu ban đầu:", data);

    // Xử lý dữ liệu
    const clean_data = data.map((item) => ({
      ...item,
      created_date: item["Thoi_gian"] 
        ? new Date(item["Thoi_gian"]).toISOString().split("T")[0] 
        : null, // Chuyển đổi Date thành định dạng YYYY-MM-DD
      ngay: item["Thoi_gian"] 
        ? new Date(item["Thoi_gian"]).getDate().toString().padStart(2, '0') 
        : null // Lấy ngày, thêm '0' nếu cần
    }));

    console.log("Cleaned data:", clean_data);

    // Vẽ biểu đồ
    drawChart5(clean_data);
  } catch (error) {
    console.error("Lỗi xử lý dữ liệu:", error);
  }
});


const drawChart5 = (data) => {
    
  
    // Đặt kích thước cho SVG
    const width = 1200;
    const height = 600;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    const chartWidth = width - margin.left - margin.right - 180;
    const chartHeight = height - margin.top - margin.bottom;
  
    // Xử lý dữ liệu
    
    const groupedData = d3.rollups(
      d3.group(
          data.filter((d) => d.ngay !== null), 
          (d) => d.created_date // Nhóm trước theo created_date
      ),
      (values) => {
          const totalRNperDate = values.map(([date, items]) => ({
              ngay: date, 
              total: d3.sum(items, (d) => d["total"]),
              count: d3.sum(items, (d) => d["sL"]),
          }));
  
          const avgRN = d3.sum(totalRNperDate, (d) => d.total) / totalRNperDate.length;
          const avgSL = d3.sum(totalRNperDate, (d) => d.count) / totalRNperDate.length;
  
          return { avgRN, avgSL };
      },
      ([date, items]) => items[0].ngay // Nhóm lại theo `ngay` sau khi đã nhóm theo ngày
  );
  
    const processingData = Array.from(groupedData, ([ngay, { avgRN, avgSL }]) => ({
        ngay: ngay,
        TBDT: avgRN,
        TBSL: avgSL,
    })).sort((a, b) => a.ngay - b.ngay);

    console.log("processingData:", processingData);
  
    // Tạo SVG
    const svg = d3
      .select("#q5")
      .attr("width", width)
      .attr("height", height);
  
    // Scales
    const xScale = d3
      .scaleBand()
      .domain(processingData.map((d) => `Ngày ${d.ngay}`))
      .range([0, chartWidth])
      .padding(0.2);
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(processingData, (d) => d.TBDT)])
      .range([chartHeight, 0]);
  
    // const colorScale = d3.scaleOrdinal(d3.schemeSet2)
    // .domain(processingData.map((d) => `Ngày ${d.ngay}`))
    const colorScale = d3.scaleSequential()
    .domain([0, 1])
    .interpolator(d3.interpolateHsl("#ea96a3", "#e992be"))

  
    // Dịch SVG
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 100},${margin.top})`);
  
    // Dịch trục
    g.append("g").call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));
    
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
        .attr("transform", "rotate(45)")  // Xoay 45 độ
        .style("text-anchor", "start")   // Căn chỉnh chữ
        .attr("dx", "0.5em")  // Dịch chuyển ngang
        .attr("dy", "0.5em"); 

    // Thêm các thanh cột
    g.selectAll(".bar")
      .data(processingData)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(`Ngày ${d.ngay}`))
      .attr("y", (d) => yScale(d.TBDT))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => chartHeight - yScale(d.TBDT))
      .attr("fill", (d) => colorScale(d.ngay))
      .on("mouseover", (event, d) => {
        // Hiển thị tooltip khi hover
        const tooltip = d3.select("#tooltip5");
        tooltip
          .style("opacity", 1)
          .html(
            `Ngày ${d.ngay}<br>Doanh số bán TB: ${(d.TBDT/1_000_000).toFixed(1)} triệu VNĐ<br>Số lượng bán TB: ${(d.TBSL).toFixed(0)} SKUs`
          )
          .style("left", `${event.pageX + 10}px`) // Vị trí tooltip theo chiều ngang
          .style("top", `${event.pageY - 28}px`); // Vị trí tooltip theo chiều dọc
      })
      .on("mouseout", () => {
        // Ẩn tooltip khi chuột ra khỏi thanh
        d3.select("#tooltip5").style("opacity", 0);
      })
    // Tiêu đề
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Doanh số bán hàng trung bình theo Ngày trong tháng");
    
    // Thêm label cho mỗi cột
    g.selectAll(".label")
    .data(processingData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(`Ngày ${d.ngay}`) + xScale.bandwidth() / 2) // Đặt nhãn ở giữa cột
    .attr("y", (d) => yScale(d.TBDT) - 5) // Đặt nhãn ở phía trên cột
    .attr("text-anchor", "middle") // Căn giữa nhãn
    .style("fill", "black") // Màu chữ
    .style("font-size", "10px") // Cỡ chữ
    .text((d) => (d.TBDT/1_000_000).toFixed(1) + " tr"); // Nội dung nhãn (tổng số)
    
  };

