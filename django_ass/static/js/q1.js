document.addEventListener("DOMContentLoaded", function () {
  try {
    console.log("Dữ liệu ban đầu:", data);
    const clean_data = data.map((item) => ({
        ...item,
        created_date: item["Thoi_gian"] ? new Date(item["Thoi_gian"]) : null,
        ma_ten_MH: `[${item["ma_MH"]}] ${item["ten_MH"]}`,
        ma_ten_NH: `[${item["ma_NH"]}] ${item["ten_NH"]}`
    }));
    console.log("Cleaned data:", clean_data);
    drawChart1(clean_data);
  } catch (error) {
    console.error("Lỗi xử lý dữ liệu:", error);
  }
});

const drawChart1 = (data) => {
    
  
    // Đặt kích thước cho SVG
    const width = 900;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    const chartWidth = width - margin.left - margin.right - 400;
    const chartHeight = height - margin.top - margin.bottom;
  
    // Xử lý dữ liệu
    const groupedData = d3.group(data, (d) => d.ma_ten_MH);
    const processedData = Array.from(groupedData, ([key, values]) => ({
      ma_ten_MH: key,
      ma_ten_NH: values[0]["ma_ten_NH"],
      total: d3.sum(values, (d) => d["total"] || 0), // Tổng giá trị
      count: d3.sum(values, (d) => d["sL"] || 0), // Tổng số lượng
    })).sort((a,b)=> b.total-a.total);
  
    console.log("processedData:", processedData);
  
    // Tạo SVG
    const svg = d3
      .select("#q1")
      .attr("width", width)
      .attr("height", height);
  
    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(processedData, (d) => d.total)])
      .range([0, chartWidth]);
  
    const yScale = d3
      .scaleBand()
      .domain(processedData.map((d) => d.ma_ten_MH))
      .range([0, chartHeight])
      .padding(0.2);
  
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(processedData.map((d) => d.ma_ten_NH))
    

  
    // Dịch SVG
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 200},${margin.top})`);
  
    // Dịch trục
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format(".2s")));
  
    g.append("g").call(d3.axisLeft(yScale));

    // Thêm các thanh cột
    g.selectAll(".bar")
      .data(processedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0) // Thanh bắt đầu từ 0
      .attr("y", (d) => yScale(d.ma_ten_MH))
      .attr("width", (d) => xScale(d.total))
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.ma_ten_NH))
      .on("mouseover", (event, d) => {
        // Hiển thị tooltip khi hover
        const tooltip = d3.select("#tooltip1");
        tooltip
          .style("opacity", 1)
          .html(
            `Mặt hàng: ${d.ma_ten_MH}<br>Nhóm hàng: ${d.ma_ten_NH}<br>Doanh số bán: ${(d.total / 1_000_000).toFixed(0)} triệu VNĐ<br>Số lượng bán: ${d.count} SKUs`
          )
          .style("left", `${event.pageX + 10}px`) // Vị trí tooltip theo chiều ngang
          .style("top", `${event.pageY - 28}px`); // Vị trí tooltip theo chiều dọc
      })
      .on("mouseout", () => {
        // Ẩn tooltip khi chuột ra khỏi thanh
        d3.select("#tooltip1").style("opacity", 0);
      })
    // Tiêu đề
    svg
      .append("text")
      .attr("x", width / 2 + 20)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Doanh số bán hàng theo Mặt hàng");
    // Thêm label
    g.selectAll(".label")
    .data(processedData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.total) + 5) // Cách thanh 5px
    .attr("y", (d) => yScale(d.ma_ten_MH) + yScale.bandwidth() / 2) // Căn giữa thanh
    .attr("dy", "0.35em") // Điều chỉnh để text thẳng hàng
    .attr("text-anchor", "start") // Căn trái
    .style("fill", "black") // Màu chữ
    .style("font-size", "12px") // Cỡ chữ
    .text((d) => (d.total / 1_000_000).toFixed(0) + " triệu VNĐ"); 

    // Thêm legend
    const legend = svg.append("g")
    .attr("transform", "translate(750, 55)");
    legend.selectAll("rect")
    .data(colorScale.domain())
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 30)  // Đặt vị trí các legend item
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", d => colorScale(d));

    legend.selectAll("text")
    .data(colorScale.domain())
    .enter()
    .append("text")
    .attr("x", 30)
    .attr("y", (d, i) => i * 30 + 15)
    .text(d => d)  // hiển thị ma_ten_NH
    .attr("font-size", "14px")
    .attr("fill", "black");

  };

