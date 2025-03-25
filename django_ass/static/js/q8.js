document.addEventListener("DOMContentLoaded", function () {
  try {
    console.log("Dữ liệu ban đầu:", data);
    
    // Xử lý dữ liệu
    const clean_data = data.map((item) => ({
      ...item,
      created_date: item["Thoi_gian"] ? new Date(item["Thoi_gian"]) : null, // Chuyển đổi Date
      month: item["Thoi_gian"] 
        ? (new Date(item["Thoi_gian"]).getMonth() + 1).toString().padStart(2, '0') 
        : null,
      ma_ten_NH: `[${item["ma_NH"]}] ${item["ten_NH"]}`
    }));

    console.log("Cleaned data:", clean_data);

    // Vẽ biểu đồ
    drawChart8(clean_data);
  } catch (error) {
    console.error("Lỗi xử lý dữ liệu:", error);
  }
});


const drawChart8 = (data) => {
    
  
    // Đặt kích thước cho SVG
    const width = 1000;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    const chartWidth = width - margin.left - margin.right - 300;
    const chartHeight = height - margin.top - margin.bottom;
  
    // Xử lý dữ liệu
    const dataByMonth = d3.group(data, (d) => d.month);
            const groupedData = Array.from(dataByMonth, ([month, item]) => {
                const OrderByMonth = new Set(item.map((d) => d["Bill_id"]));
                const slOrderByMonth = OrderByMonth.size;
                const dataByCategory = d3.group(item, (d) => d.ma_ten_NH);

                return Array.from(dataByCategory, ([ma_ten_NH, groupItem]) => {
                    const OrderByCategory = new Set(groupItem.map((d) => d["Bill_id"]));
                    const slOrderByCategory = OrderByCategory.size;
                    const xacsuat = slOrderByMonth > 0 ? slOrderByCategory * 100 / slOrderByMonth : 0;
                    return {
                        month,
                        ma_ten_NH,
                        xacsuat,
                        slOrderByCategory
                    };
                });
            });
    processingData = groupedData.flat()
    console.log("processingData:", processingData);
  
    // Tạo SVG
    const svg = d3
      .select("#q8")
      .attr("width", width)
      .attr("height", height);
  
    // Scales
    const xScale = d3
      .scalePoint()  // Đổi từ scaleBand() sang scalePoint()
      .domain([...new Set(processingData.map((d) => `Tháng ${d.month}`))])  
      .range([0, chartWidth])  
      .padding(0.5);
    
        const yScale = d3
            .scaleLinear()
            .domain([
                d3.min(processingData, (d) => d.xacsuat) - 5,
                d3.max(processingData, (d) => d.xacsuat) + 5,
            ])
            .range([chartHeight, 0]);
    
        const colorScale = d3
            .scaleOrdinal()
            .domain([...new Set(processingData.map((d) => d.ma_ten_NH))])
            .range(d3.schemeTableau10);
  
    // Dịch SVG
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 150},${margin.top})`);
  
// Grouped data
const groupData = d3.group(processingData, (d) => d.ma_ten_NH);
    
// Draw lines and circles
groupData.forEach((records, groupName) => {
    g.append("path")
        .datum(records)
        .attr("fill", "none")
        .attr("stroke", colorScale(groupName))
        .attr("stroke-width", 2)
        .attr(
            "d",
            d3.line()
                .x((d) => xScale(`Tháng ${d.month}`))
                .y((d) => yScale(d.xacsuat))
        );

    g.selectAll(`.circle-${groupName}`)
        .data(records)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(`Tháng ${d.month}`))
        .attr("cy", (d) => yScale(d.xacsuat))
        .attr("r", 5)
        .attr("fill", colorScale(groupName))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
            // Hiển thị tooltip khi hover
            const tooltip = d3.select("#tooltip8");
            tooltip
              .style("opacity", 1)
              .html(
                `Tháng ${d.month}|Nhóm hàng ${d.ma_ten_NH}<br>Số lượng đơn bán: ${(d.slOrderByCategory)}<br>Xác suất bán: ${(d.xacsuat).toFixed(1)}%`
              )
              .style("left", `${event.pageX + 10}px`) // Vị trí tooltip theo chiều ngang
              .style("top", `${event.pageY - 28}px`); // Vị trí tooltip theo chiều dọc
          })
          .on("mouseout", () => {
            // Ẩn tooltip khi chuột ra khỏi thanh
            d3.select("#tooltip8").style("opacity", 0);
          })
});

// Thêm legend
const legend = svg.append("g")
.attr("transform", "translate(800, 60)");
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


// Axes

g.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)  
    .call(d3.axisBottom(xScale))

const yAxis = d3.axisLeft(yScale).ticks(10).tickFormat((d) => `${(d).toFixed(0)}%`);
g.append("g").call(yAxis);

// Title
svg.append("text")
.attr("x", width / 2)
.attr("y", margin.top / 2)
.attr("text-anchor", "middle")
.style("font-size", "16px")
.style("font-weight", "bold")
.text("Xác suất bán hàng của Nhóm hàng theo Tháng");

  };

