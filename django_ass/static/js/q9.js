document.addEventListener("DOMContentLoaded", function () {
    try {
        console.log("Dữ liệu ban đầu:", data);

        // Xử lý dữ liệu
        const clean_data = data.map((item) => ({
            ...item,
            created_date: item["Thoi_gian"] ? new Date(item["Thoi_gian"]) : null, // Chuyển đổi Date
            ma_ten_MH: `[${item["ma_MH"]}] ${item["ten_MH"]}`,
            ma_ten_NH: `[${item["ma_NH"]}] ${item["ten_NH"]}`
        }));

        // Nhóm dữ liệu theo category
        const dataByCategory = d3.group(clean_data, (d) => d.ma_ten_NH);

        const processedData = Array.from(dataByCategory, ([ma_ten_NH, items]) => {
            const orderByCategory = new Set(items.map((d) => d["Bill_id"]));
            const slOrderByCategory = orderByCategory.size;

            const dataByMH = d3.group(items, (d) => d.ma_ten_MH);

            return Array.from(dataByMH, ([ma_ten_MH, mhItems]) => {
                const orderByMH = new Set(mhItems.map((d) => d["Bill_id"]));
                const slOrderMH = orderByMH.size;
                const xacSuat = slOrderMH / slOrderByCategory;

                return {
                    ma_ten_NH,
                    ma_ten_MH,
                    xacSuat,
                    slOrderMH
                };
            });
        });

        const processingData = processedData.flat();
        console.log("Cleaned data:", processingData);

        // Vẽ biểu đồ
        drawChart9(processingData);
    } catch (error) {
        console.error("Lỗi khi xử lý dữ liệu:", error);
    }
});

  const drawChart9 = (data) => {
    const width = 370;
    const height = 220;
    const margin = { top: 70, left: 100, right: 40, bottom: 30 };

    // Nhóm dữ liệu theo nhóm hàng
    const groupedData = d3.group(data, (d) => d.ma_ten_NH);

    // Tạo SVG cha và thiết lập chiều rộng, chiều cao
    const svgParent = d3.select("#q9")
    .attr("width", width * 3 + margin.left + margin.right) // Chiều rộng của SVG cha
    .attr("height", height * 2 + margin.top + margin.bottom ) // Chiều cao của SVG cha được tính toán lại
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Thêm tiêu đề tổng
    svgParent
    .append("text")
    .attr("x", (width * 2.5) / 2)
    .attr("y", -margin.top /1.5) // Đẩy tiêu đề lên trên một chút
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng");

    // Tạo các SVG con cho từng nhóm
    const svg = svgParent.selectAll("g.chart-group")
    .data(Array.from(groupedData))
    .enter()
    .append("g") // Tạo nhóm (group) để chứa từng biểu đồ con
    .attr("class", "chart-group")
    .attr("transform", (d, i) => {
        const col = i % 3; // Xác định cột
        const row = Math.floor(i / 3); // Xác định hàng
        return `translate(${col * (width + 40)}, ${row * (height + 30)})`;
    });
    // Ghép nhiều bộ màu lại với nhau để có đủ màu
    const combinedColors = d3.schemeTableau10.concat(d3.schemeSet2, d3.schemeSet3);

    // Lấy danh sách mặt hàng duy nhất (không trùng lặp giữa các nhóm hàng)
    const uniqueItems = Array.from(new Set(data.map(d => d.ma_ten_MH)));
    
    svg.each(function ([ma_ten_NH, items]) {
            const agroup = d3.select(this);

            items.sort((a, b) => d3.descending(a.xacSuat, b.xacSuat));

            // Tạo thang đo
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(items, (d) => d.xacSuat)])
                .range([0, width - margin.left - margin.right - 20]);

            const yScale = d3.scaleBand()
                .domain(items.map((d) => d.ma_ten_MH))
                .range([0, height - margin.top - margin.bottom + 40])
                .padding(0.2);

            // Trục X
            agroup.append("g")
                .attr("transform", `translate(${margin.left - 100}, ${height - margin.bottom - 30})`)
                .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => `${(d * 100).toFixed(0)}%`));

            // Trục Y
            agroup.append("g").call(d3.axisLeft(yScale));

            // Tạo màu sắc cho từng mặt hàng
            const colorScale = d3.scaleOrdinal()
            .domain(uniqueItems)
            .range(combinedColors)

            // Vẽ thanh biểu đồ
            agroup.selectAll(".bar")
                .data(items)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", 0)
                .attr("y", (d) => yScale(d.ma_ten_MH))
                .attr("width", (d) => xScale(d.xacSuat))
                .attr("height", yScale.bandwidth())
                .attr("fill", (d) => colorScale(d.ma_ten_MH))
                .on("mouseover", (event, d) => {
                    const tooltip = d3.select("#tooltip9");
                    tooltip
                        .style("opacity", 1)
                        .html(
                            `Mặt hàng: ${d.ma_ten_MH}<br>Nhóm hàng: ${d.ma_ten_NH}<br>Số lượng đơn bán: ${d.slOrderMH}<br>Xác suất bán: ${(d.xacSuat * 100).toFixed(1)}%`
                        )
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mouseout", () => {
                    d3.select("#tooltip9").style("opacity", 0);
                });

            // Tiêu đề nhóm hàng
            agroup.append("text")
                .attr("x", (width - margin.left - margin.right) / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .text(ma_ten_NH)
                .style("font-size", "14px")
                .style("font-weight", "bold");
            // Thêm label
            agroup.selectAll(".label")
            .data(items)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", (d) => xScale(d.xacSuat) + 5) // Cách thanh 5px
            .attr("y", (d) => yScale(d.ma_ten_MH) + yScale.bandwidth() / 2) // Căn giữa thanh
            .attr("dy", "0.35em") // Điều chỉnh để text thẳng hàng
            .attr("text-anchor", "start") // Căn trái
            .style("fill", "black") // Màu chữ
            .style("font-size", "12px") // Cỡ chữ
            .text((d) => (d.xacSuat*100).toFixed(1) + "%");
        });
  
};
